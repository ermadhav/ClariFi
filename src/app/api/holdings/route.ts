import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/holdings - Fetch all holdings for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const holdings = await prisma.holding.findMany({
      where: { userId: session.user.id },
      orderBy: { currentValue: 'desc' },
    });

    // Calculate portfolio stats
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    const totalPnl = totalValue - totalInvested;
    const dayPnl = holdings.reduce((sum, h) => sum + h.dayChange * h.quantity, 0);

    return NextResponse.json({
      holdings,
      stats: {
        totalValue,
        totalInvested,
        totalPnl,
        totalPnlPercent: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
        dayPnl,
        dayPnlPercent: totalValue > 0 ? (dayPnl / totalValue) * 100 : 0,
        holdingCount: holdings.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch holdings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/holdings - Add a new holding
const addHoldingSchema = z.object({
  symbol: z.string().min(1).max(20),
  exchange: z.enum(['NSE', 'BSE']).default('NSE'),
  companyName: z.string().min(1),
  sector: z.string().min(1),
  industry: z.string().min(1),
  marketCap: z.enum(['LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MICRO_CAP']),
  quantity: z.number().int().positive(),
  averagePrice: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = addHoldingSchema.parse(body);
    const totalInvested = data.quantity * data.averagePrice;

    // Upsert: if holding exists, update qty and avg price
    const existing = await prisma.holding.findUnique({
      where: {
        userId_symbol_exchange: {
          userId: session.user.id,
          symbol: data.symbol,
          exchange: data.exchange,
        },
      },
    });

    let holding;
    if (existing) {
      const newQty = existing.quantity + data.quantity;
      const newAvg = (existing.totalInvested + totalInvested) / newQty;
      holding = await prisma.holding.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          averagePrice: newAvg,
          totalInvested: existing.totalInvested + totalInvested,
        },
      });
    } else {
      holding = await prisma.holding.create({
        data: {
          userId: session.user.id,
          ...data,
          totalInvested,
          currentValue: totalInvested,
          firstBoughtDate: new Date(),
        },
      });
    }

    return NextResponse.json({ holding }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to add holding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
