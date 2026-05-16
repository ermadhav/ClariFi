import { NextRequest, NextResponse } from 'next/server';
import { ZerodhaAPI } from '@/lib/apis/brokers/zerodha';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const api = new ZerodhaAPI();
    const authUrl = await api.getAuthUrl(session.user.id);
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Zerodha auth error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate auth url' }, { status: 500 });
  }
}
