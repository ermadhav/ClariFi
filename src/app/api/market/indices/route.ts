import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Yahoo Finance tickers: Nifty 50 (^NSEI), Sensex (^BSESN), Bank Nifty (^NSEBANK)
    const symbols = ['^NSEI', '^BSESN', '^NSEBANK'];
    
    const fetchSymbol = async (symbol: string) => {
      const response = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.chart?.result?.[0]?.meta;
    };

    const results = await Promise.all(symbols.map(fetchSymbol));
    
    const indices = results.filter(Boolean).map((meta: any) => {
      let name = meta.symbol;
      if (meta.symbol === '^NSEI') name = 'NIFTY 50';
      if (meta.symbol === '^BSESN') name = 'SENSEX';
      if (meta.symbol === '^NSEBANK') name = 'BANK NIFTY';
      
      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose || meta.previousClose;
      const change = price - prev;
      const changePercent = (change / prev) * 100;
      
      return {
        name,
        value: price,
        change: change,
        changePercent: changePercent
      };
    });
    
    // Sort in order: NIFTY 50, SENSEX, BANK NIFTY
    const order = ['NIFTY 50', 'SENSEX', 'BANK NIFTY'];
    indices.sort((a: any, b: any) => order.indexOf(a.name) - order.indexOf(b.name));
    
    return NextResponse.json({ indices });
  } catch (error) {
    console.error('Indices fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch indices' }, { status: 500 });
  }
}
