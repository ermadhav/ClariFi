import { NextRequest, NextResponse } from 'next/server';
import { UpstoxAPI } from '@/lib/apis/brokers/upstox';
import prisma from '@/lib/prisma';
import { encryptToken } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  if (!code || !state) {
    return NextResponse.redirect(`${NEXTAUTH_URL}/?error=auth_failed`);
  }
  
  try {
    const api = new UpstoxAPI();
    const authResult = await api.handleCallback(code, state);
    
    const encryptedAccessToken = encryptToken(authResult.accessToken);
    const encryptedRefreshToken = authResult.refreshToken ? encryptToken(authResult.refreshToken) : null;
    
    await prisma.brokerAccount.upsert({
      where: {
        userId_brokerName: {
          userId: authResult.userId,
          brokerName: 'UPSTOX',
        }
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: authResult.expiresIn ? new Date(Date.now() + authResult.expiresIn * 1000) : null,
        isConnected: true,
        lastSynced: new Date(),
      },
      create: {
        userId: authResult.userId,
        brokerName: 'UPSTOX',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: authResult.expiresIn ? new Date(Date.now() + authResult.expiresIn * 1000) : null,
        isConnected: true,
      }
    });
    
    // Trigger immediate sync
    fetch(`${NEXTAUTH_URL}/api/brokers/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authResult.userId, broker: 'UPSTOX' })
    }).catch(e => console.error("Immediate sync trigger failed:", e));
    
    return NextResponse.redirect(`${NEXTAUTH_URL}/?success=true`);
  } catch (error) {
    console.error('Upstox callback error:', error);
    return NextResponse.redirect(`${NEXTAUTH_URL}/?error=connection_failed`);
  }
}
