import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { mockHoldings } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { brokerName } = body;

    // Create a dummy broker account
    const broker = await prisma.brokerAccount.create({
      data: {
        userId: session.user.id,
        broker: brokerName === 'Zerodha' ? 'ZERODHA' : brokerName === 'Groww' ? 'GROWW' : brokerName === 'Upstox' ? 'UPSTOX' : 'ANGEL_ONE',
        clientId: 'DEMO' + Math.floor(Math.random() * 10000),
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
        accessToken: 'demo-token',
      }
    });

    // Seed holdings from mock data to the database
    for (const h of mockHoldings) {
      await prisma.holding.create({
        data: {
          userId: session.user.id,
          symbol: h.symbol,
          exchange: h.exchange === 'BSE' ? 'BSE' : 'NSE',
          companyName: h.companyName,
          sector: h.sector,
          industry: h.sector, // simplified
          marketCap: 'LARGE_CAP',
          quantity: h.quantity,
          averagePrice: h.averagePrice,
          currentPrice: h.currentPrice,
          totalInvested: h.quantity * h.averagePrice,
          currentValue: h.currentValue,
          pnl: h.pnl,
          pnlPercent: h.pnlPercent,
          dayChange: h.dayChange,
          dayChangePercent: h.dayChangePercent,
          weight: h.weight,
          firstBoughtDate: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
        }
      });
    }

    return NextResponse.json({ success: true, message: `Successfully connected to ${brokerName} and synced portfolio.` });
  } catch (error) {
    console.error('Simulate broker error:', error);
    return NextResponse.json({ error: 'Failed to simulate broker connection' }, { status: 500 });
  }
}
