import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/user/profile - Get user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
        goals: true,
        brokerAccounts: {
          select: { id: true, broker: true, isActive: true, lastSyncAt: true, syncStatus: true },
        },
        _count: { select: { holdings: true, transactions: true, alerts: true, watchlists: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        panNumber: user.panNumber ? `${user.panNumber.slice(0, 3)}****${user.panNumber.slice(-2)}` : null,
        riskAppetite: user.riskAppetite,
        isOnboarded: user.isOnboarded,
        subscription: user.subscription,
        goals: user.goals,
        brokers: user.brokerAccounts,
        stats: user._count,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const allowedFields = ['name', 'phone', 'panNumber', 'dateOfBirth', 'riskAppetite', 'isOnboarded'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'dateOfBirth') {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // Handle goals
    if (body.goals && Array.isArray(body.goals)) {
      await prisma.userGoal.deleteMany({ where: { userId: session.user.id } });
      await prisma.userGoal.createMany({
        data: body.goals.map((g: string) => ({
          userId: session.user.id,
          goalType: g,
        })),
      });
    }

    return NextResponse.json({ user: { id: user.id, name: user.name, isOnboarded: user.isOnboarded } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
