import { NextRequest, NextResponse } from 'next/server';
import { UpstoxAPI } from '@/lib/apis/brokers/upstox';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  let userId = session?.user?.id;
  
  // Dev bypass if cookies are out of sync
  if (!userId && process.env.NODE_ENV === 'development') {
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'demo@clarifi.app',
        }
      });
    }
    userId = defaultUser.id;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 });
  }
  
  try {
    const api = new UpstoxAPI();
    const authUrl = await api.getAuthUrl(userId);
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Upstox auth error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate auth url' }, { status: 500 });
  }
}
