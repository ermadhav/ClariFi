import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getIndices, getHistoricalPrices } from '@/lib/market-data';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/market?action=quote&symbol=RELIANCE
// GET /api/market?action=indices
// GET /api/market?action=history&symbol=RELIANCE&range=1y
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'indices';
    const symbol = searchParams.get('symbol');
    const exchange = searchParams.get('exchange') || 'NSE';
    const range = searchParams.get('range') || '1y';

    switch (action) {
      case 'quote': {
        if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        const quote = await getStockQuote(symbol, exchange);
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        return NextResponse.json({ quote });
      }

      case 'indices': {
        const indices = await getIndices();
        return NextResponse.json({ indices });
      }

      case 'history': {
        if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        const prices = await getHistoricalPrices(symbol, exchange, range);
        return NextResponse.json({ prices, symbol, range });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Market data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/market - Refresh prices for all user holdings
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const holdings = await prisma.holding.findMany({
      where: { userId: session.user.id },
      select: { id: true, symbol: true, exchange: true, quantity: true, averagePrice: true, totalInvested: true },
    });

    let updated = 0;
    for (const h of holdings) {
      const quote = await getStockQuote(h.symbol, h.exchange);
      if (quote) {
        const currentValue = h.quantity * quote.price;
        const pnl = currentValue - h.totalInvested;
        await prisma.holding.update({
          where: { id: h.id },
          data: {
            currentPrice: quote.price,
            currentValue,
            pnl,
            pnlPercent: h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0,
            dayChange: quote.change,
            dayChangePercent: quote.changePercent,
            high52w: quote.high52w || undefined,
            low52w: quote.low52w || undefined,
            volume: quote.volume || undefined,
            lastUpdated: new Date(),
          },
        });
        updated++;
      }
    }

    // Recalculate weights
    const totalValue = await prisma.holding.aggregate({
      where: { userId: session.user.id },
      _sum: { currentValue: true },
    });

    if (totalValue._sum.currentValue && totalValue._sum.currentValue > 0) {
      const allHoldings = await prisma.holding.findMany({ where: { userId: session.user.id } });
      for (const h of allHoldings) {
        await prisma.holding.update({
          where: { id: h.id },
          data: { weight: (h.currentValue / totalValue._sum.currentValue) * 100 },
        });
      }
    }

    return NextResponse.json({ success: true, updated, total: holdings.length });
  } catch (error) {
    console.error('Price refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
