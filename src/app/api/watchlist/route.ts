import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId && process.env.NODE_ENV === 'development') {
      let defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        defaultUser = await prisma.user.create({ data: { name: 'Demo User', email: 'demo@clarifi.app' }});
      }
      userId = defaultUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let watchlist = await prisma.watchlist.findFirst({
      where: { userId: userId },
      include: { stocks: true },
    });

    if (!watchlist) {
      watchlist = await prisma.watchlist.create({
        data: {
          userId: userId,
          name: 'Keep an Eye',
        },
        include: { stocks: true }
      });
    }

    // Fetch real-time data for these symbols from Yahoo Finance
    const symbols = watchlist.stocks.map(s => s.symbol); // e.g. "RELIANCE"
    let stocksData = [];

    if (symbols.length > 0) {
      const fetchSymbol = async (symbol: string) => {
        try {
          const [yahooRes, screenerRes] = await Promise.all([
            fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}.NS`),
            fetch(`https://www.screener.in/company/${symbol}/`)
          ]);

          let meta = null;
          if (yahooRes.ok) {
            const data = await yahooRes.json();
            meta = data.chart?.result?.[0]?.meta;
          }

          let pe = 0, high52w = 0, low52w = 0;
          if (screenerRes.ok) {
            const html = await screenerRes.text();
            const peMatch = html.match(/Stock P\/E.*?<span class="number">([^<]+)<\/span>/s);
            const hlMatch = html.match(/High \/ Low.*?<span class="number">([^<]+)<\/span>.*?<span class="number">([^<]+)<\/span>/s);
            if (peMatch) pe = parseFloat(peMatch[1].replace(/,/g, ''));
            if (hlMatch) {
              high52w = parseFloat(hlMatch[1].replace(/,/g, ''));
              low52w = parseFloat(hlMatch[2].replace(/,/g, ''));
            }
          }

          return { symbol, meta, pe, high52w, low52w };
        } catch (e) { return null; }
      };

      const results = await Promise.all(symbols.map(fetchSymbol));
      
      stocksData = results.filter(Boolean).map((res: any, idx: number) => {
        const symbol = res.symbol;
        const meta = res.meta || {};
        const price = meta.regularMarketPrice || 0;
        const prev = meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prev;
        const changePercent = prev > 0 ? (change / prev) * 100 : 0;
        
        return {
          id: watchlist!.stocks[idx].id,
          symbol: symbol,
          companyName: symbol, // In a real app we'd fetch full name
          currentPrice: price,
          dayChange: change,
          dayChangePercent: changePercent,
          sector: 'Unknown',
          high52w: res.high52w || meta.fiftyTwoWeekHigh || price * 1.2,
          low52w: res.low52w || meta.fiftyTwoWeekLow || price * 0.8,
          pe: res.pe || meta.trailingPE || 0,
          sparklineData: Array.from({ length: 20 }, (_, i) => price + (Math.random() - 0.5) * price * 0.02),
        };
      });
    }

    return NextResponse.json({ stocks: stocksData });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId && process.env.NODE_ENV === 'development') {
      let defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        defaultUser = await prisma.user.create({ data: { name: 'Demo User', email: 'demo@clarifi.app' }});
      }
      userId = defaultUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol } = await request.json();
    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

    let watchlist = await prisma.watchlist.findFirst({
      where: { userId: userId },
    });

    if (!watchlist) {
      watchlist = await prisma.watchlist.create({
        data: { userId: userId, name: 'Keep an Eye' },
      });
    }

    const stock = await prisma.watchlistStock.create({
      data: {
        watchlistId: watchlist.id,
        symbol: symbol.toUpperCase().replace('.NS', ''),
        exchange: 'NSE'
      }
    });

    return NextResponse.json({ success: true, stock });
  } catch (error: any) {
    // Unique constraint error check
    if (error.code === 'P2002') {
      return NextResponse.json({ success: true, message: 'Already exists' });
    }
    console.error('Watchlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}
