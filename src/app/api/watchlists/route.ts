import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/watchlists
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: { stocks: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ watchlists });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/watchlists - Create new or add stock
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (body.action === 'create') {
      const watchlist = await prisma.watchlist.create({
        data: {
          userId: session.user.id,
          name: body.name,
          color: body.color || '#6366f1',
        },
      });
      return NextResponse.json({ watchlist }, { status: 201 });
    }

    if (body.action === 'add_stock') {
      const stock = await prisma.watchlistStock.create({
        data: {
          watchlistId: body.watchlistId,
          symbol: body.symbol,
          exchange: body.exchange || 'NSE',
        },
      });
      return NextResponse.json({ stock }, { status: 201 });
    }

    if (body.action === 'remove_stock') {
      await prisma.watchlistStock.delete({ where: { id: body.stockId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
