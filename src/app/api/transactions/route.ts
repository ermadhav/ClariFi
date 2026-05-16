import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/transactions - Fetch transactions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { userId: session.user.id };
    if (symbol) where.symbol = symbol;
    if (type === 'BUY' || type === 'SELL') where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/transactions - Record a new transaction
const transactionSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.enum(['NSE', 'BSE']).default('NSE'),
  companyName: z.string().min(1),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  pricePerShare: z.number().positive(),
  brokerage: z.number().min(0).default(0),
  broker: z.string().min(1),
  date: z.string().transform((s) => new Date(s)),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = transactionSchema.parse(body);
    const totalAmount = data.quantity * data.pricePerShare;

    // Calculate charges (approximate Indian brokerage)
    const stt = data.type === 'SELL' ? totalAmount * 0.001 : totalAmount * 0.001; // 0.1%
    const gst = data.brokerage * 0.18;
    const stampDuty = data.type === 'BUY' ? totalAmount * 0.00015 : 0;
    const totalCharges = data.brokerage + stt + gst + stampDuty;
    const netAmount = data.type === 'BUY' ? totalAmount + totalCharges : totalAmount - totalCharges;

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        symbol: data.symbol,
        exchange: data.exchange,
        companyName: data.companyName,
        type: data.type,
        quantity: data.quantity,
        pricePerShare: data.pricePerShare,
        totalAmount,
        brokerage: data.brokerage,
        stt,
        gst,
        stampDuty,
        totalCharges,
        netAmount,
        broker: data.broker,
        date: data.date,
        notes: data.notes,
      },
    });

    // Auto-update holdings
    const existingHolding = await prisma.holding.findUnique({
      where: {
        userId_symbol_exchange: {
          userId: session.user.id,
          symbol: data.symbol,
          exchange: data.exchange,
        },
      },
    });

    if (data.type === 'BUY') {
      if (existingHolding) {
        const newQty = existingHolding.quantity + data.quantity;
        const newInvested = existingHolding.totalInvested + totalAmount;
        await prisma.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: newQty,
            averagePrice: newInvested / newQty,
            totalInvested: newInvested,
          },
        });
      }
      // If no holding exists, it should be created via /api/holdings
    } else if (data.type === 'SELL' && existingHolding) {
      const newQty = existingHolding.quantity - data.quantity;
      if (newQty <= 0) {
        // Calculate capital gain before deleting
        const gain = (data.pricePerShare - existingHolding.averagePrice) * data.quantity;
        const holdingDays = Math.floor((data.date.getTime() - existingHolding.firstBoughtDate.getTime()) / 86400000);
        const gainType = holdingDays > 365 ? 'LTCG' : 'STCG';
        const taxRate = gainType === 'STCG' ? 0.20 : 0.125;

        await prisma.capitalGain.create({
          data: {
            userId: session.user.id,
            symbol: data.symbol,
            companyName: data.companyName,
            type: gainType,
            buyDate: existingHolding.firstBoughtDate,
            sellDate: data.date,
            quantity: data.quantity,
            buyPrice: existingHolding.averagePrice,
            sellPrice: data.pricePerShare,
            gain,
            tax: Math.max(0, gain * taxRate),
            financialYear: getFY(data.date),
            holdingPeriod: holdingDays,
          },
        });

        await prisma.holding.delete({ where: { id: existingHolding.id } });
      } else {
        const soldInvested = existingHolding.averagePrice * data.quantity;
        await prisma.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: newQty,
            totalInvested: existingHolding.totalInvested - soldInvested,
          },
        });

        // Record capital gain for partial sell
        const gain = (data.pricePerShare - existingHolding.averagePrice) * data.quantity;
        const holdingDays = Math.floor((data.date.getTime() - existingHolding.firstBoughtDate.getTime()) / 86400000);
        const gainType = holdingDays > 365 ? 'LTCG' : 'STCG';
        const taxRate = gainType === 'STCG' ? 0.20 : 0.125;

        await prisma.capitalGain.create({
          data: {
            userId: session.user.id,
            symbol: data.symbol,
            companyName: data.companyName,
            type: gainType,
            buyDate: existingHolding.firstBoughtDate,
            sellDate: data.date,
            quantity: data.quantity,
            buyPrice: existingHolding.averagePrice,
            sellPrice: data.pricePerShare,
            gain,
            tax: Math.max(0, gain * taxRate),
            financialYear: getFY(data.date),
            holdingPeriod: holdingDays,
          },
        });
      }
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getFY(date: Date): string {
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();
  if (month >= 3) return `FY ${year}-${(year + 1).toString().slice(2)}`;
  return `FY ${year - 1}-${year.toString().slice(2)}`;
}
