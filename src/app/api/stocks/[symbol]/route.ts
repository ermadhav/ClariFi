import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const resolvedParams = await params;
    const symbol = resolvedParams.symbol;
    
    // Get URL search params for range and interval
    const urlObj = new URL(request.url);
    const range = urlObj.searchParams.get('range') || '1y';
    let interval = urlObj.searchParams.get('interval') || '1d';
    
    // Adjust interval to match TradingView standards
    if (!urlObj.searchParams.get('interval')) {
        if (['1mo', '6mo', '1y'].includes(range)) interval = '1d';
        else if (['3y', '5y'].includes(range)) interval = '1wk';
        else interval = '1mo'; // 10y and max
    }

    // append .NS if not present and not an index
    const fetchSymbol = (symbol.includes('.') || symbol.startsWith('^')) ? symbol : `${symbol}.NS`;
    
    // Always fetch max range so we have enough historical data to calculate the 200 SMA accurately
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fetchSymbol}?range=max&interval=${interval}`;
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${fetchSymbol}`;
    
    const [chartRes, quoteRes] = await Promise.all([
      fetch(chartUrl),
      fetch(quoteUrl)
    ]);
    
    if (!chartRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
    
    const data = await chartRes.json();
    const quoteData = quoteRes.ok ? await quoteRes.json() : null;
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];

    let allHistorical = timestamps.map((t: number, i: number) => ({
      date: t * 1000,
      open: quote.open?.[i],
      high: quote.high?.[i],
      low: quote.low?.[i],
      close: quote.close?.[i],
      volume: quote.volume?.[i],
    })).filter((d: any) => d.close !== null);

    // Calculate SMAs
    for (let i = 0; i < allHistorical.length; i++) {
      if (i >= 49) {
        let sum = 0;
        for (let j = i - 49; j <= i; j++) sum += allHistorical[j].close;
        allHistorical[i].dma50 = sum / 50;
      }
      if (i >= 199) {
        let sum = 0;
        for (let j = i - 199; j <= i; j++) sum += allHistorical[j].close;
        allHistorical[i].dma200 = sum / 200;
      }
    }

    // Slice to the requested range
    const now = Date.now();
    const rangeMs: Record<string, number> = {
      '1mo': 30 * 24 * 60 * 60 * 1000,
      '6mo': 180 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      '3y': 3 * 365 * 24 * 60 * 60 * 1000,
      '5y': 5 * 365 * 24 * 60 * 60 * 1000,
      '10y': 10 * 365 * 24 * 60 * 60 * 1000,
      'max': Infinity
    };
    
    const cutoff = rangeMs[range] ? now - rangeMs[range] : 0;
    const historical = allHistorical.filter((d: any) => d.date >= cutoff);

    // Extract actual daily quote data if available
    const realQuote = quoteData?.quoteResponse?.result?.[0];
    const currentPrice = realQuote?.regularMarketPrice || meta.regularMarketPrice;
    const prevClose = realQuote?.regularMarketPreviousClose || meta.chartPreviousClose;
    const dayChange = currentPrice - prevClose;
    const dayChangePercent = (dayChange / prevClose) * 100;

    return NextResponse.json({
      symbol: meta.symbol,
      companyName: realQuote?.longName || realQuote?.shortName || meta.longName || meta.shortName || symbol,
      currency: meta.currency,
      exchange: meta.exchangeName,
      currentPrice: currentPrice,
      previousClose: prevClose,
      dayChange: dayChange,
      dayChangePercent: dayChangePercent,
      high52w: realQuote?.fiftyTwoWeekHigh || meta.fiftyTwoWeekHigh || currentPrice * 1.2,
      low52w: realQuote?.fiftyTwoWeekLow || meta.fiftyTwoWeekLow || currentPrice * 0.8,
      historical,
    });
  } catch (error) {
    console.error('Stock detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
