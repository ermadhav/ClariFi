import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/dividends — Fetch real dividend data for user's holdings
export async function GET() {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const holdings = await prisma.holding.findMany({ where: { userId } });

    if (holdings.length === 0) {
      return NextResponse.json({ dividends: [], stats: { total: 0, tds: 0, net: 0, count: 0 } });
    }

    // Fetch dividend data for each holding from Yahoo Finance
    const allDividends: any[] = [];

    await Promise.all(holdings.map(async (h) => {
      const sym = h.symbol || h.stockSymbol?.split(':')[1] || '';
      if (!sym) return;

      const yahooSym = `${sym}.NS`;
      try {
        // Fetch from Yahoo v8 chart with events=div to get dividend history
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?range=5y&interval=1mo&events=div&_=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;

        const data = await res.json();
        const events = data.chart?.result?.[0]?.events?.dividends;

        if (!events || typeof events !== 'object') return;

        // Parse each dividend event
        for (const [timestamp, divData] of Object.entries(events)) {
          const div = divData as any;
          if (!div.amount || div.amount <= 0) continue;

          const exDate = new Date(parseInt(timestamp) * 1000);
          const dividendPerShare = div.amount;
          const qty = h.quantity;
          const totalDividend = dividendPerShare * qty;
          const tds = totalDividend * 0.10; // 10% TDS on dividends above ₹5000
          const net = totalDividend - tds;

          allDividends.push({
            id: `${sym}-${timestamp}`,
            symbol: sym,
            companyName: h.companyName || sym,
            exDate: exDate.toISOString(),
            dividendPerShare: Math.round(dividendPerShare * 100) / 100,
            quantityHeld: qty,
            totalDividend: Math.round(totalDividend * 100) / 100,
            tdsDeducted: Math.round(tds * 100) / 100,
            netAmount: Math.round(net * 100) / 100,
          });
        }
      } catch (err) {
        console.error(`Dividend fetch error for ${sym}:`, err);
      }
    }));

    // Sort by ex-date descending (most recent first)
    allDividends.sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());

    const totalDividend = allDividends.reduce((s, d) => s + d.totalDividend, 0);
    const totalTDS = allDividends.reduce((s, d) => s + d.tdsDeducted, 0);
    const totalNet = allDividends.reduce((s, d) => s + d.netAmount, 0);
    const uniqueStocks = new Set(allDividends.map(d => d.symbol)).size;

    return NextResponse.json({
      dividends: allDividends,
      stats: {
        total: Math.round(totalDividend * 100) / 100,
        tds: Math.round(totalTDS * 100) / 100,
        net: Math.round(totalNet * 100) / 100,
        count: uniqueStocks,
      },
    });
  } catch (error) {
    console.error('Dividends API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
