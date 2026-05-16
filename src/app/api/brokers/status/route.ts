import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  let userId = session?.user?.id;
  
  if (!userId && process.env.NODE_ENV === 'development') {
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({ data: { name: 'Demo User', email: 'demo@clarifi.app' }});
    }
    userId = defaultUser.id;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId: userId },
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
