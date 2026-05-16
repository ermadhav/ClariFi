// Market data service - fetches live prices from free APIs
// Uses: Yahoo Finance (unofficial), Google Finance, or NSE direct

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  pe: number;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

// Fetch stock quote from Yahoo Finance (free, no API key needed)
export async function getStockQuote(symbol: string, exchange: string = 'NSE'): Promise<StockQuote | null> {
  try {
    const yahooSymbol = exchange === 'BSE' ? `${symbol}.BO` : `${symbol}.NS`;
    const response = await fetch(`${YAHOO_BASE}/${yahooSymbol}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) return null;
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    return {
      symbol,
      price: meta.regularMarketPrice || 0,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
      changePercent: meta.previousClose ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 : 0,
      open: quote?.open?.[0] || meta.regularMarketPrice || 0,
      high: quote?.high?.[0] || meta.regularMarketPrice || 0,
      low: quote?.low?.[0] || meta.regularMarketPrice || 0,
      close: meta.previousClose || 0,
      volume: quote?.volume?.[0] || 0,
      high52w: meta.fiftyTwoWeekHigh || 0,
      low52w: meta.fiftyTwoWeekLow || 0,
      marketCap: 0, // Yahoo chart API doesn't return this
      pe: 0,
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

// Fetch multiple stock quotes in batch
export async function getBatchQuotes(symbols: string[], exchange: string = 'NSE'): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  // Yahoo Finance doesn't support batch via chart API, so fetch in parallel
  const promises = symbols.map(async (symbol) => {
    const quote = await getStockQuote(symbol, exchange);
    if (quote) results.set(symbol, quote);
  });

  await Promise.allSettled(promises);
  return results;
}

// Fetch Indian market indices
export async function getIndices(): Promise<IndexData[]> {
  const indexSymbols = [
    { yahoo: '^NSEI', name: 'NIFTY 50' },
    { yahoo: '^BSESN', name: 'SENSEX' },
    { yahoo: '^NSEBANK', name: 'BANK NIFTY' },
    { yahoo: 'NIFTY_MID_SELECT.NS', name: 'NIFTY MIDCAP' },
    { yahoo: '^NSMIDCP', name: 'NIFTY IT' },
  ];

  const results: IndexData[] = [];

  for (const idx of indexSymbols) {
    try {
      const response = await fetch(`${YAHOO_BASE}/${idx.yahoo}?interval=1d&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta) {
          results.push({
            name: idx.name,
            value: meta.regularMarketPrice || 0,
            change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
            changePercent: meta.previousClose ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 : 0,
          });
        }
      }
    } catch {
      // Skip failed indices
    }
  }

  return results;
}

// Fetch historical price data for charts
export async function getHistoricalPrices(symbol: string, exchange: string = 'NSE', range: string = '1y'): Promise<{ date: string; price: number; volume: number }[]> {
  try {
    const yahooSymbol = exchange === 'BSE' ? `${symbol}.BO` : `${symbol}.NS`;
    const intervalMap: Record<string, string> = {
      '1d': '5m', '1w': '15m', '1mo': '1h', '3mo': '1d', '6mo': '1d', '1y': '1d', '3y': '1wk', '5y': '1mo',
    };

    const interval = intervalMap[range] || '1d';
    const response = await fetch(`${YAHOO_BASE}/${yahooSymbol}?interval=${interval}&range=${range}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });

    if (!response.ok) return [];
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];

    return timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString(),
      price: closes[i] || 0,
      volume: volumes[i] || 0,
    })).filter((d: { price: number }) => d.price > 0);
  } catch (error) {
    console.error(`Failed to fetch history for ${symbol}:`, error);
    return [];
  }
}
