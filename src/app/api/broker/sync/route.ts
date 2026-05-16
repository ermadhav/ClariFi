import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getBrokerAdapter } from '@/lib/brokers';

// POST /api/broker/sync - Sync holdings from connected broker
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { brokerId } = body;

    // Get broker account
    const brokerAccount = await prisma.brokerAccount.findFirst({
      where: { id: brokerId, userId: session.user.id, isActive: true },
    });

    if (!brokerAccount) {
      return NextResponse.json({ error: 'Broker account not found' }, { status: 404 });
    }

    if (!brokerAccount.accessToken) {
      return NextResponse.json({ error: 'Broker not authenticated. Please reconnect.' }, { status: 401 });
    }

    // Update sync status
    await prisma.brokerAccount.update({
      where: { id: brokerId },
      data: { syncStatus: 'SYNCING' },
    });

    try {
      const adapter = getBrokerAdapter(brokerAccount.broker);
      const brokerHoldings = await adapter.getHoldings(brokerAccount.accessToken);

      let synced = 0;
      let errors = 0;

      for (const bh of brokerHoldings) {
        try {
          await prisma.holding.upsert({
            where: {
              userId_symbol_exchange: {
                userId: session.user.id,
                symbol: bh.symbol,
                exchange: bh.exchange === 'BSE' ? 'BSE' : 'NSE',
              },
            },
            update: {
              quantity: bh.quantity,
              averagePrice: bh.averagePrice,
              currentPrice: bh.lastPrice,
              totalInvested: bh.quantity * bh.averagePrice,
              currentValue: bh.quantity * bh.lastPrice,
              pnl: bh.pnl,
              pnlPercent: bh.averagePrice > 0 ? ((bh.lastPrice - bh.averagePrice) / bh.averagePrice) * 100 : 0,
              dayChange: bh.dayChange,
              lastUpdated: new Date(),
            },
            create: {
              userId: session.user.id,
              symbol: bh.symbol,
              exchange: bh.exchange === 'BSE' ? 'BSE' : 'NSE',
              companyName: bh.companyName,
              sector: 'Unknown', // Will be enriched later
              industry: 'Unknown',
              marketCap: 'LARGE_CAP',
              quantity: bh.quantity,
              averagePrice: bh.averagePrice,
              currentPrice: bh.lastPrice,
              totalInvested: bh.quantity * bh.averagePrice,
              currentValue: bh.quantity * bh.lastPrice,
              pnl: bh.pnl,
              pnlPercent: bh.averagePrice > 0 ? ((bh.lastPrice - bh.averagePrice) / bh.averagePrice) * 100 : 0,
              dayChange: bh.dayChange,
              firstBoughtDate: new Date(),
            },
          });
          synced++;
        } catch {
          errors++;
        }
      }

      // Update sync status
      await prisma.brokerAccount.update({
        where: { id: brokerId },
        data: { syncStatus: 'SYNCED', lastSyncAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        synced,
        errors,
        total: brokerHoldings.length,
        message: `Synced ${synced} holdings from ${brokerAccount.broker}`,
      });
    } catch (syncError) {
      await prisma.brokerAccount.update({
        where: { id: brokerId },
        data: { syncStatus: 'FAILED' },
      });
      throw syncError;
    }
  } catch (error) {
    console.error('Broker sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// GET /api/broker/sync - Get connected brokers and sync status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const brokers = await prisma.brokerAccount.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        broker: true,
        clientId: true,
        isActive: true,
        lastSyncAt: true,
        syncStatus: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ brokers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
