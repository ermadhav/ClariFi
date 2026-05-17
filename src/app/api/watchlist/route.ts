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

    let watchlists = await prisma.watchlist.findMany({
      where: { userId: userId },
      include: { stocks: true },
    });

    if (watchlists.length === 0) {
      const defaultWatchlist = await prisma.watchlist.create({
        data: {
          userId: userId,
          name: 'Keep an Eye',
          color: '#f59e0b'
        },
        include: { stocks: true }
      });
      watchlists = [defaultWatchlist];
    }

    const allSymbols = new Set<string>();
    watchlists.forEach(w => w.stocks.forEach(s => allSymbols.add(s.symbol)));

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

    const results = await Promise.all(Array.from(allSymbols).map(fetchSymbol));
    const dataMap = new Map();
    results.filter(Boolean).forEach((res: any) => dataMap.set(res.symbol, res));

    const watchlistsData = watchlists.map(w => ({
      id: w.id,
      name: w.name,
      color: w.color,
      stocks: w.stocks.map(s => {
        const res = dataMap.get(s.symbol) || { symbol: s.symbol };
        const meta = res.meta || {};
        const price = meta.regularMarketPrice || 0;
        const prev = meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prev;
        const changePercent = prev > 0 ? (change / prev) * 100 : 0;
        
        return {
          id: s.id,
          symbol: s.symbol,
          companyName: s.symbol,
          currentPrice: price,
          dayChange: change,
          dayChangePercent: changePercent,
          sector: 'Unknown',
          high52w: res.high52w || meta.fiftyTwoWeekHigh || price * 1.2,
          low52w: res.low52w || meta.fiftyTwoWeekLow || price * 0.8,
          pe: res.pe || meta.trailingPE || 0,
          sparklineData: Array.from({ length: 20 }, (_, i) => price + (Math.random() - 0.5) * price * 0.02),
        };
      })
    }));

    return NextResponse.json({ watchlists: watchlistsData });
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

    const body = await request.json();
    const { name, color, symbol, watchlistId } = body;

    // Create new watchlist
    if (name && !symbol) {
      const newWatchlist = await prisma.watchlist.create({
        data: {
          userId: userId,
          name: name,
          color: color || '#6366f1'
        }
      });
      return NextResponse.json({ success: true, watchlist: newWatchlist });
    }

    // Add stock to existing watchlist
    if (!symbol || !watchlistId) {
      return NextResponse.json({ error: 'Symbol and watchlistId required' }, { status: 400 });
    }

    const stock = await prisma.watchlistStock.create({
      data: {
        watchlistId: watchlistId,
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

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId && process.env.NODE_ENV === 'development') {
      let defaultUser = await prisma.user.findFirst();
      if (defaultUser) userId = defaultUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const watchlistId = searchParams.get('watchlistId');
    
    if (!watchlistId) return NextResponse.json({ error: 'watchlistId required' }, { status: 400 });

    // Verify ownership
    const watchlist = await prisma.watchlist.findUnique({ where: { id: watchlistId } });
    if (!watchlist || watchlist.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!symbol) {
      // Delete the entire watchlist and its stocks
      await prisma.watchlistStock.deleteMany({
        where: { watchlistId: watchlistId }
      });
      await prisma.watchlist.delete({
        where: { id: watchlistId }
      });
      return NextResponse.json({ success: true, message: 'Watchlist deleted' });
    }

    // Delete a specific stock
    await prisma.watchlistStock.deleteMany({
      where: {
        watchlistId: watchlistId,
        symbol: symbol
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
