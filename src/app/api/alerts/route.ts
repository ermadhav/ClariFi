import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/alerts - Fetch all alerts for user
export async function GET() {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    // Fallback for demo
    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        history: {
          orderBy: { triggeredAt: 'desc' },
          take: 5,
        },
      },
    });

    const active = alerts.filter(a => a.isActive && !a.triggered).length;
    const triggered = alerts.filter(a => a.triggered).length;

    return NextResponse.json({ alerts, stats: { active, triggered, total: alerts.length } });
  } catch (error) {
    console.error('GET /api/alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/alerts - Create alert
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.condition) {
      return NextResponse.json({ error: 'type and condition are required' }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        symbol: body.symbol || null,
        companyName: body.companyName || null,
        type: body.type,
        condition: body.condition,
        conditionParams: body.conditionParams || null,
        targetValue: body.targetValue ? parseFloat(body.targetValue) : null,
        notifyInApp: body.notifyInApp ?? true,
        notifyEmail: body.notifyEmail ?? false,
        notifySMS: body.notifySMS ?? false,
        cooldownMinutes: body.cooldownMinutes ?? 60,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('POST /api/alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/alerts - Update alert (toggle active, edit)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });

    // Ensure alert belongs to user
    const existing = await prisma.alert.findFirst({
      where: { id: body.id, userId },
    });
    if (!existing) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

    const updateData: any = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.conditionParams !== undefined) updateData.conditionParams = body.conditionParams;
    if (body.targetValue !== undefined) updateData.targetValue = parseFloat(body.targetValue);
    if (body.notifyInApp !== undefined) updateData.notifyInApp = body.notifyInApp;
    if (body.notifyEmail !== undefined) updateData.notifyEmail = body.notifyEmail;

    const alert = await prisma.alert.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('PATCH /api/alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/alerts?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });

    await prisma.alert.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
