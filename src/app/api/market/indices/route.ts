import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Yahoo Finance tickers: Nifty 50 (^NSEI), Sensex (^BSESN), Bank Nifty (^NSEBANK)
    const symbols = '^NSEI,^BSESN,^NSEBANK';
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Yahoo Finance');
    }
    
    const data = await response.json();
    const quotes = data.quoteResponse.result;
    
    const indices = quotes.map((q: any) => {
      let name = q.symbol;
      if (q.symbol === '^NSEI') name = 'NIFTY 50';
      if (q.symbol === '^BSESN') name = 'SENSEX';
      if (q.symbol === '^NSEBANK') name = 'BANK NIFTY';
      
      return {
        name,
        value: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent
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
