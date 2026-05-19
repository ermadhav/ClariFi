import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/holdings/live — Fetch live prices for all holdings and return updated data
export async function GET() {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const holdings = await prisma.holding.findMany({
      where: { userId },
      orderBy: { currentValue: 'desc' },
    });

    if (holdings.length === 0) {
      return NextResponse.json({ holdings: [], stats: null });
    }

    // Fetch live prices for all holdings in parallel
    const cacheBuster = Date.now();
    const updatedHoldings = await Promise.all(holdings.map(async (h) => {
      const sym = h.symbol || h.stockSymbol?.split(':')[1] || '';
      if (!sym) return h;

      const yahooSym = (sym.includes('.') || sym.startsWith('^')) ? sym : `${sym}.NS`;
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?range=2d&interval=1d&_=${cacheBuster}`,
          { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
        );
        if (!res.ok) return h;

        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];

        if (!meta?.regularMarketPrice) return h;

        const livePrice = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || h.averagePrice;
        const dayChange = livePrice - prevClose;
        const dayChangePercent = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;
        const currentValue = livePrice * h.quantity;
        const pnl = currentValue - h.totalInvested;
        const pnlPercent = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;

        return {
          ...h,
          currentPrice: livePrice,
          currentValue,
          pnl,
          pnlPercent,
          dayChange,
          dayChangePercent,
        };
      } catch (err) {
        console.error(`Live price error for ${sym}:`, err);
        return h;
      }
    }));

    // Calculate live portfolio stats
    const totalValue = updatedHoldings.reduce((s, h) => s + (h.currentValue || 0), 0);
    const totalInvested = updatedHoldings.reduce((s, h) => s + (h.totalInvested || 0), 0);
    const totalPnl = totalValue - totalInvested;
    const dayPnl = updatedHoldings.reduce((s, h) => s + ((h.dayChange || 0) * h.quantity), 0);

    let bestPerformer = null;
    if (updatedHoldings.length > 0) {
      const top = updatedHoldings.reduce((best, h) => (h.pnlPercent || 0) > (best.pnlPercent || 0) ? h : best, updatedHoldings[0]);
      if ((top.pnlPercent || 0) > 0) {
        bestPerformer = { symbol: top.symbol || top.stockSymbol?.split(':')[1] || '', pnlPercent: top.pnlPercent };
      }
    }

    return NextResponse.json({
      holdings: updatedHoldings,
      stats: {
        totalValue,
        totalInvested,
        totalPnl,
        totalPnlPercent: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
        dayPnl,
        dayPnlPercent: totalValue > 0 ? (dayPnl / totalValue) * 100 : 0,
        holdingCount: updatedHoldings.length,
        bestPerformer,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Live holdings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
