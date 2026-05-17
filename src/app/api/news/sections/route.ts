import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// For development: fallback to demo user if not logged in
const DEMO_EMAIL = 'demo@clarifi.app';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    let user = null;

    if (session?.user?.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } });
    }

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get holdings to count unique stocks
    const holdings = await prisma.holding.findMany({
      where: { userId: user.id },
      select: { stockSymbol: true }
    });
    const uniqueHoldings = new Set(holdings.map(h => h.stockSymbol.replace('.NS', '').replace('.BO', '')));

    // 2. Get user's watchlists
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        stocks: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const sections = [];

    // Auto-generated section: My Holdings
    sections.push({
      id: 'my-holdings',
      name: 'My Holdings',
      stockCount: uniqueHoldings.size,
      symbols: Array.from(uniqueHoldings),
      type: 'holdings'
    });

    let keepAnEyeFound = false;
    
    for (const wl of watchlists) {
      if (wl.name.toLowerCase() === 'keep an eye') keepAnEyeFound = true;
      sections.push({
        id: wl.id,
        name: wl.name,
        stockCount: wl.stocks.length,
        symbols: wl.stocks.map(s => s.symbol),
        type: 'watchlist'
      });
    }

    if (!keepAnEyeFound) {
      sections.splice(1, 0, {
        id: 'keep-an-eye',
        name: 'Keep an Eye',
        stockCount: 0,
        symbols: [],
        type: 'watchlist'
      });
    }

    // Auto-generated section: All Market
    sections.push({
      id: 'all-market',
      name: 'All Market',
      stockCount: null,
      symbols: [],
      type: 'market'
    });

    return NextResponse.json({ sections });

  } catch (error) {
    console.error('Failed to fetch news sections:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
