import { NextRequest, NextResponse } from 'next/server';
import { AngelOneAPI } from '@/lib/apis/brokers/angelone';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encryptToken } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { clientId, password, totp } = await request.json();
    
    if (!clientId || !password || !totp) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }
    
    const api = new AngelOneAPI();
    const authResult = await api.authenticateUser(clientId, password, totp);
    
    const encryptedAccessToken = encryptToken(authResult.accessToken);
    const encryptedRefreshToken = authResult.refreshToken ? encryptToken(authResult.refreshToken) : null;
    
    await prisma.brokerAccount.upsert({
      where: {
        userId_brokerName: {
          userId: session.user.id,
          brokerName: 'ANGEL_ONE',
        }
      },
      update: {
        clientId: clientId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        isConnected: true,
        lastSynced: new Date(),
      },
      create: {
        userId: session.user.id,
        brokerName: 'ANGEL_ONE',
        clientId: clientId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        isConnected: true,
      }
    });
    
    // Trigger immediate sync
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    fetch(`${NEXTAUTH_URL}/api/brokers/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, broker: 'ANGEL_ONE' })
    }).catch(e => console.error("Immediate sync trigger failed:", e));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Angel One auth error:', error);
    return NextResponse.json({ error: error.message || 'Failed to authenticate with Angel One' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Return the path to the manual credential form
  return NextResponse.json({ authUrl: `/settings/brokers/angelone-login` });
}
