import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId: session.user.id },
      select: {
        brokerName: true,
        isConnected: true,
        lastSynced: true,
      }
    });

    return NextResponse.json({ brokerAccounts });
  } catch (error) {
    console.error('Failed to fetch broker status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
