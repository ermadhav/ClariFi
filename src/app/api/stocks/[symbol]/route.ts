import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const resolvedParams = await params;
    const symbol = resolvedParams.symbol;
    
    // Get URL search params for range and interval
    const urlObj = new URL(request.url);
    const range = urlObj.searchParams.get('range') || '1y';
    let interval = urlObj.searchParams.get('interval') || '1d';
    
    // Adjust interval for longer ranges if not provided
    if (!urlObj.searchParams.get('interval')) {
        if (range === '5y' || range === '10y' || range === 'max') interval = '1wk';
        if (range === '1mo') interval = '15m';
        if (range === '6mo') interval = '1d';
    }

    // append .NS if not present and not an index
    const fetchSymbol = (symbol.includes('.') || symbol.startsWith('^')) ? symbol : `${symbol}.NS`;
    
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fetchSymbol}?range=${range}&interval=${interval}`;
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

    const historical = timestamps.map((t: number, i: number) => ({
      date: t * 1000,
      open: quote.open?.[i],
      high: quote.high?.[i],
      low: quote.low?.[i],
      close: quote.close?.[i],
      volume: quote.volume?.[i],
    })).filter((d: any) => d.close !== null);

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
