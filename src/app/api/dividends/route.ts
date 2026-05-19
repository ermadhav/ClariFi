import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/dividends — Fetch real dividend data for user's historical holdings
export async function GET() {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all transactions to build a historical timeline of holdings
    const [transactions, holdings] = await Promise.all([
      prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      prisma.holding.findMany({ where: { userId } })
    ]);

    if (transactions.length === 0 && holdings.length === 0) {
      return NextResponse.json({ dividends: [], stats: { total: 0, tds: 0, net: 0, count: 0 } });
    }

    // Group transactions by symbol
    const txBySymbol: Record<string, any[]> = {};
    const companyNames: Record<string, string> = {};
    
    // First, process explicit transaction history
    transactions.forEach(tx => {
      const sym = tx.symbol || '';
      if (!sym) return;
      if (!txBySymbol[sym]) txBySymbol[sym] = [];
      txBySymbol[sym].push({ type: tx.type, quantity: tx.quantity, date: tx.date });
      companyNames[sym] = tx.companyName;
    });

    // Second, if a user has a holding but no transactions (e.g. manually added holdings), 
    // simulate a "BUY" transaction on their firstBoughtDate so they still get dividends.
    holdings.forEach(h => {
      const sym = h.symbol || h.stockSymbol?.split(':')[1] || '';
      if (!sym) return;
      companyNames[sym] = h.companyName || sym;
      
      if (!txBySymbol[sym] || txBySymbol[sym].length === 0) {
        txBySymbol[sym] = [{
          type: 'BUY',
          quantity: h.quantity,
          // If no firstBoughtDate is set, assume they've held it for 10 years to catch all historical dividends
          date: h.firstBoughtDate || new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
        }];
      }
    });

    const uniqueSymbols = Object.keys(txBySymbol);
    const allDividends: any[] = [];

    // Fetch dividend data for each historically held stock
    await Promise.all(uniqueSymbols.map(async (sym) => {
      const yahooSym = (sym.includes('.') || sym.startsWith('^')) ? sym : `${sym}.NS`;
      try {
        // Fetch from Yahoo v8 chart with events=div
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?range=10y&interval=1mo&events=div&_=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;

        const data = await res.json();
        const events = data.chart?.result?.[0]?.events?.dividends;

        if (!events || typeof events !== 'object') return;

        const symbolTxs = txBySymbol[sym];

        // Parse each dividend event
        for (const [timestamp, divData] of Object.entries(events)) {
          const div = divData as any;
          if (!div.amount || div.amount <= 0) continue;

          const exDate = new Date(parseInt(timestamp) * 1000);
          
          // Calculate how many shares the user held just before the ex-date
          let quantityHeld = 0;
          for (const tx of symbolTxs) {
            // To get the dividend, the stock must be bought before the ex-date
            if (tx.date < exDate) {
              if (tx.type === 'BUY') quantityHeld += tx.quantity;
              else if (tx.type === 'SELL') quantityHeld -= tx.quantity;
            } else {
              // Transactions on or after ex-date don't affect this dividend payout
              break; 
            }
          }

          // If the user held shares during this dividend payout, record it
          if (quantityHeld > 0) {
            const dividendPerShare = div.amount;
            const totalDividend = dividendPerShare * quantityHeld;
            // Standard 10% TDS (simplified logic for UI display)
            const tds = totalDividend * 0.10; 
            const net = totalDividend - tds;

            allDividends.push({
              id: `${sym}-${timestamp}`,
              symbol: sym,
              companyName: companyNames[sym] || sym,
              exDate: exDate.toISOString(),
              dividendPerShare: Math.round(dividendPerShare * 100) / 100,
              quantityHeld: quantityHeld,
              totalDividend: Math.round(totalDividend * 100) / 100,
              tdsDeducted: Math.round(tds * 100) / 100,
              netAmount: Math.round(net * 100) / 100,
            });
          }
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

