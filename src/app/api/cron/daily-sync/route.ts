import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Fetch all users with connected brokers
    const users = await prisma.user.findMany({
      where: {
        brokerAccounts: {
          some: { isConnected: true }
        }
      },
      select: { id: true }
    });
    
    const results = [];
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    for (const user of users) {
      try {
        // Trigger sync for each user
        const res = await fetch(`${NEXTAUTH_URL}/api/brokers/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id, // Internal authentication
          },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (res.ok) {
            results.push({ userId: user.id, success: true });
        } else {
            results.push({ userId: user.id, success: false });
        }
      } catch (error) {
        results.push({ userId: user.id, success: false });
      }
    }
    
    return NextResponse.json({
      success: true,
      syncedUsers: results.filter(r => r.success).length,
      failedUsers: results.filter(r => !r.success).length,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
