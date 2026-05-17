import { NextResponse } from 'next/server';

const SYMBOL_MAP: Record<string, string> = {
  // Indices
  '^NSEI': 'NIFTY 50',
  '^BSESN': 'SENSEX',
  '^NSEBANK': 'BANK NIFTY',
  '^NSEMDCP50': 'NIFTY MIDCAP',
  '^CNXIT': 'NIFTY IT',

  // Sectors
  '^CNXAUTO': 'Auto',
  '^CNXPHARMA': 'Pharma',
  '^CNXENERGY': 'Energy',
  '^CNXFMCG': 'FMCG',
  '^CNXMETAL': 'Metals',
  '^CNXREALTY': 'Realty',
  '^CNXMEDIA': 'Media',

  // Global
  '^DJI': 'Dow Jones',
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ',
  '^FTSE': 'FTSE 100',
  '^N225': 'Nikkei 225',
  '^HSI': 'Hang Seng',

  // Commodities
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'Crude Oil',

  // Currencies
  'INR=X': 'USD/INR',
  'EURINR=X': 'EUR/INR',
  'GBPINR=X': 'GBP/INR',
};

// Movers pool (large Indian caps)
const MOVER_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 
  'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'HINDUNILVR.NS', 'BAJFINANCE.NS', 
  'TATAMOTORS.NS', 'SUNPHARMA.NS', 'MARUTI.NS', 'ASIANPAINT.NS', 'WIPRO.NS'
];

export async function GET() {
  try {
    const allSymbols = [...Object.keys(SYMBOL_MAP), ...MOVER_SYMBOLS];
    const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${allSymbols.join(',')}&range=1d&interval=15m`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Yahoo API failed');
    
    const data = await res.json();
    const responses = data.spark?.result || [];

    const parsed: Record<string, any> = {};

    responses.forEach((r: any) => {
      const sym = r.symbol;
      const meta = r.meta || {};
      const price = meta.regularMarketPrice || 0;
      const prev = meta.chartPreviousClose || meta.previousClose || price;
      const change = price - prev;
      const changePercent = prev > 0 ? (change / prev) * 100 : 0;
      
      let sparkline: number[] = [];
      try {
        const closeArray = r.indicators?.quote?.[0]?.close || [];
        sparkline = closeArray.filter((v: number | null) => v !== null);
      } catch(e) {}
      
      parsed[sym] = {
        symbol: sym,
        name: SYMBOL_MAP[sym] || sym.replace('.NS', ''),
        value: price,
        change,
        changePercent,
        sparkline
      };
    });

    // 1. Indices
    const indices = ['^NSEI', '^BSESN', '^NSEBANK', '^NSEMDCP50', '^CNXIT'].map(s => parsed[s]).filter(Boolean);

    // 2. Sectors (combine with Nifty IT and Bank Nifty)
    const sectors = ['^CNXIT', '^NSEBANK', '^CNXAUTO', '^CNXPHARMA', '^CNXENERGY', '^CNXFMCG', '^CNXMETAL', '^CNXREALTY', '^CNXMEDIA'].map(s => {
      const p = parsed[s];
      return p ? { name: p.name, change: p.changePercent, stocks: 10 + Math.floor(Math.random()*40) } : null;
    }).filter(Boolean);

    // 3. Global Indices
    const globalIndices = ['^DJI', '^GSPC', '^IXIC', '^FTSE', '^N225', '^HSI'].map(s => parsed[s]).filter(Boolean);

    // 4. Commodities
    const commodities = ['GC=F', 'SI=F', 'CL=F'].map(s => {
      const p = parsed[s];
      if (!p) return null;
      let formatPrice = `$${p.value.toFixed(2)}`;
      if (s === 'GC=F') formatPrice = `$${p.value.toFixed(1)}/oz`;
      if (s === 'SI=F') formatPrice = `$${p.value.toFixed(2)}/oz`;
      if (s === 'CL=F') formatPrice = `$${p.value.toFixed(2)}/bbl`;
      return { name: p.name, price: formatPrice, change: p.changePercent };
    }).filter(Boolean);

    // 5. Currencies
    const currencies = ['INR=X', 'EURINR=X', 'GBPINR=X'].map(s => {
      const p = parsed[s];
      return p ? { pair: p.name, value: parseFloat(p.value.toFixed(2)), change: p.changePercent } : null;
    }).filter(Boolean);

    // 6. Movers
    const moversPool = MOVER_SYMBOLS.map(s => parsed[s]).filter(Boolean);
    const sortedMovers = [...moversPool].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sortedMovers.slice(0, 5).map(m => ({
      symbol: m.name,
      companyName: m.name,
      currentPrice: m.value,
      dayChangePercent: m.changePercent,
      sector: 'NSE'
    }));
    const topLosers = sortedMovers.slice(-5).reverse().map(m => ({
      symbol: m.name,
      companyName: m.name,
      currentPrice: m.value,
      dayChangePercent: m.changePercent,
      sector: 'NSE'
    }));

    return NextResponse.json({
      indices,
      sectors,
      globalIndices,
      commodities,
      currencies,
      topGainers,
      topLosers
    });
  } catch (error) {
    console.error('Market Overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch market overview' }, { status: 500 });
  }
}
