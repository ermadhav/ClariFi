import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/portfolio/chart?period=1Y — Real portfolio + Nifty chart data
export async function GET(request: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1Y';

    // Map period to Yahoo range/interval
    let range = '1y', interval = '1d';
    switch (period) {
      case '1D': range = '1d'; interval = '5m'; break;
      case '1W': range = '5d'; interval = '15m'; break;
      case '1M': range = '1mo'; interval = '1d'; break;
      case '3M': range = '3mo'; interval = '1d'; break;
      case '6M': range = '6mo'; interval = '1d'; break;
      case '1Y': range = '1y'; interval = '1d'; break;
      case '3Y': range = '3y'; interval = '1wk'; break;
      case '5Y': range = '5y'; interval = '1wk'; break;
      case 'ALL': range = 'max'; interval = '1mo'; break;
    }

    // Fetch Nifty 50 data
    const niftyRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=${range}&interval=${interval}&_=${Date.now()}`,
      { cache: 'no-store' }
    );

    let niftyData: { date: string; value: number }[] = [];
    if (niftyRes.ok) {
      const nJson = await niftyRes.json();
      const result = nJson.chart?.result?.[0];
      if (result) {
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];
        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] !== null && closes[i] !== undefined) {
            const d = new Date(timestamps[i] * 1000);
            niftyData.push({
              date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
              value: Math.round(closes[i]),
            });
          }
        }
      }
    }

    // Fetch holdings to calculate portfolio value over time
    const holdings = await prisma.holding.findMany({ where: { userId } });

    if (holdings.length === 0 || niftyData.length === 0) {
      return NextResponse.json({ chartData: niftyData.map(n => ({ ...n, portfolio: 0, benchmark: n.value })) });
    }

    // Fetch historical prices for each holding
    const holdingCharts: Record<string, number[]> = {};
    await Promise.all(holdings.map(async (h) => {
      const sym = h.symbol || h.stockSymbol?.split(':')[1] || '';
      if (!sym) return;
      const yahooSym = `${sym}.NS`;
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?range=${range}&interval=${interval}&_=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const data = await res.json();
          const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
          holdingCharts[sym] = closes;
        }
      } catch (err) {
        console.error(`Chart fetch error for ${sym}`, err);
      }
    }));

    // Build portfolio value timeline
    // Use Nifty timeline length as reference
    const chartData = niftyData.map((n, idx) => {
      let portfolioValue = 0;
      for (const h of holdings) {
        const sym = h.symbol || h.stockSymbol?.split(':')[1] || '';
        const prices = holdingCharts[sym];
        if (prices && prices[idx] !== null && prices[idx] !== undefined) {
          portfolioValue += prices[idx] * h.quantity;
        } else {
          // Fallback to average price * qty for missing data points
          portfolioValue += h.averagePrice * h.quantity;
        }
      }

      // Normalize Nifty to portfolio scale for comparison
      // Start Nifty at same level as portfolio initial value
      const niftyStart = niftyData[0]?.value || 1;
      const portfolioStart = (() => {
        let v = 0;
        for (const h of holdings) {
          const sym = h.symbol || h.stockSymbol?.split(':')[1] || '';
          const prices = holdingCharts[sym];
          if (prices && prices[0] !== null && prices[0] !== undefined) {
            v += prices[0] * h.quantity;
          } else {
            v += h.averagePrice * h.quantity;
          }
        }
        return v || 1;
      })();

      const niftyNormalized = (n.value / niftyStart) * portfolioStart;

      return {
        date: n.date,
        value: Math.round(portfolioValue),
        benchmark: Math.round(niftyNormalized),
      };
    });

    return NextResponse.json({ chartData });
  } catch (error) {
    console.error('Portfolio chart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
