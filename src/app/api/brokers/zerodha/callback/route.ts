import { NextRequest, NextResponse } from 'next/server';
import { ZerodhaAPI } from '@/lib/apis/brokers/zerodha';
import prisma from '@/lib/prisma';
import { encryptToken } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestToken = searchParams.get('request_token');
  const status = searchParams.get('status');
  const state = searchParams.get('state');
  
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  if (status !== 'success' || !requestToken || !state) {
    return NextResponse.redirect(`${NEXTAUTH_URL}/settings/brokers?error=auth_failed`);
  }
  
  try {
    const zerodhaAPI = new ZerodhaAPI();
    const authResult = await zerodhaAPI.handleCallback(requestToken, state);
    
    // Encrypt and store tokens
    const encryptedToken = encryptToken(authResult.accessToken);
    
    // Create or update broker account
    await prisma.brokerAccount.upsert({
      where: {
        userId_brokerName: {
          userId: authResult.userId,
          brokerName: 'ZERODHA',
        }
      },
      update: {
        accessToken: encryptedToken,
        isConnected: true,
        lastSynced: new Date(),
      },
      create: {
        userId: authResult.userId,
        brokerName: 'ZERODHA',
        accessToken: encryptedToken,
        isConnected: true,
      }
    });
    
    // Trigger immediate sync of holdings
    // We do this via fetch to not block the redirect response
    fetch(`${NEXTAUTH_URL}/api/brokers/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authResult.userId, broker: 'ZERODHA' })
    }).catch(e => console.error("Immediate sync trigger failed:", e));
    
    return NextResponse.redirect(`${NEXTAUTH_URL}/settings/brokers?success=true`);
  } catch (error) {
    console.error('Zerodha callback error:', error);
    return NextResponse.redirect(`${NEXTAUTH_URL}/settings/brokers?error=connection_failed`);
  }
}
