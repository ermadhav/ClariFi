import { NextRequest, NextResponse } from 'next/server';
import { UpstoxAPI } from '@/lib/apis/brokers/upstox';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  console.log('Upstox Auth - Session:', JSON.stringify(session));
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized - Please refresh and log in again' }, { status: 401 });
  }
  
  try {
    const api = new UpstoxAPI();
    const authUrl = await api.getAuthUrl(session.user.id);
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Upstox auth error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate auth url' }, { status: 500 });
  }
}
