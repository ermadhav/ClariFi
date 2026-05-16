import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ZerodhaAPI } from '@/lib/apis/brokers/zerodha';
import { UpstoxAPI } from '@/lib/apis/brokers/upstox';
import { AngelOneAPI } from '@/lib/apis/brokers/angelone';
import { decryptToken, encryptToken } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  let userId;
  
  try {
    const session = await auth();
    userId = session?.user?.id;
    
    // Check if it's an internal call with a custom header
    const internalUserId = request.headers.get('x-user-id');
    if (internalUserId) {
      userId = internalUserId;
    }
  } catch (e) {
    // Session fetching failed
  }
  
  if (!userId && process.env.NODE_ENV === 'development') {
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({ data: { name: 'Demo User', email: 'demo@clarifi.app' }});
    }
    userId = defaultUser.id;
  }
  
  const bodyText = await request.text();
  let body: any = {};
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch (e) {}
  }
  
  if (!userId && body.userId) {
    userId = body.userId;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { broker } = body;
  
  try {
    // Fetch all connected broker accounts for user
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: {
        userId: userId,
        isConnected: true,
        ...(broker && { brokerName: broker as any })
      }
    });
    
    if (brokerAccounts.length === 0) {
      return NextResponse.json({ error: 'No connected brokers' }, { status: 400 });
    }
    
    const syncResults = [];
    
    for (const account of brokerAccounts) {
      try {
        let holdings: any[] = [];
        let positions: any[] = [];
        let orders: any[] = [];
        let funds: any = null;
        let accessToken = decryptToken(account.accessToken!);
        
        // Fetch holdings based on broker
        if (account.brokerName === 'ZERODHA') {
          const api = new ZerodhaAPI();
          holdings = await api.getHoldings(accessToken);
        } else if (account.brokerName === 'UPSTOX') {
          const api = new UpstoxAPI();
          // Check if token needs refresh
          if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
            const refreshed = await api.refreshAccessToken(decryptToken(account.refreshToken!));
            accessToken = refreshed.accessToken;
            // Update token in database
            await prisma.brokerAccount.update({
              where: { id: account.id },
              data: {
                accessToken: encryptToken(refreshed.accessToken),
                tokenExpiresAt: refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : account.tokenExpiresAt
              }
            });
          }
          holdings = await api.getHoldings(accessToken);
          positions = await api.getPositions(accessToken);
          orders = await api.getOrders(accessToken);
          funds = await api.getFunds(accessToken);
        } else if (account.brokerName === 'ANGEL_ONE') {
          const api = new AngelOneAPI();
          // Angel one token refresh
          if (account.refreshToken && account.lastSynced) {
            // Very naive check: Angel One token expires in hours. Let's try refresh if old
            const hoursSinceSync = (Date.now() - account.lastSynced.getTime()) / (1000 * 60 * 60);
            if (hoursSinceSync > 23) {
                const refreshed = await api.refreshAccessToken(decryptToken(account.refreshToken!));
                accessToken = refreshed.accessToken;
                await prisma.brokerAccount.update({
                  where: { id: account.id },
                  data: {
                    accessToken: encryptToken(refreshed.accessToken),
                  }
                });
            }
          }
          holdings = await api.getHoldings(accessToken);
        }
        
        // Update or create holdings in database
        for (const holding of holdings) {
          const stockSymbol = `${holding.exchange}:${holding.symbol}`;
          const currentPrice = holding.currentPrice || holding.averagePrice;
          
          await prisma.holding.upsert({
            where: {
              userId_stockSymbol_brokerId: {
                userId: userId,
                stockSymbol: stockSymbol,
                brokerId: account.id,
              }
            },
            update: {
              quantity: holding.quantity,
              averagePrice: holding.averagePrice,
              currentPrice: currentPrice,
              companyName: holding.companyName || holding.symbol,
              sector: holding.sector || 'Uncategorized',
              industry: holding.industry || 'Uncategorized',
              currentValue: holding.quantity * currentPrice,
              totalInvested: holding.quantity * holding.averagePrice,
              pnl: holding.quantity * (currentPrice - holding.averagePrice),
              pnlPercent: holding.averagePrice > 0 ? ((currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0,
            },
            create: {
              userId: userId,
              stockSymbol: stockSymbol,
              exchange: holding.exchange,
              companyName: holding.companyName || holding.symbol,
              sector: holding.sector || 'Uncategorized',
              industry: holding.industry || 'Uncategorized',
              marketCap: 'MID_CAP', // Default
              quantity: holding.quantity,
              averagePrice: holding.averagePrice,
              currentPrice: currentPrice,
              totalInvested: holding.quantity * holding.averagePrice,
              currentValue: holding.quantity * currentPrice,
              pnl: holding.quantity * (currentPrice - holding.averagePrice),
              pnlPercent: holding.averagePrice > 0 ? ((currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0,
              firstBoughtDate: new Date(),
              brokerId: account.id,
            }
          });
        }

        // Sync Positions
        for (const pos of positions) {
          const stockSymbol = `${pos.exchange}:${pos.symbol}`;
          await prisma.position.upsert({
            where: {
              userId_symbol_brokerId_product: {
                userId: userId,
                symbol: stockSymbol,
                brokerId: account.id,
                product: pos.product || 'UNKNOWN'
              }
            },
            update: {
              quantity: pos.quantity,
              averagePrice: pos.averagePrice,
              currentPrice: pos.currentPrice,
              pnl: pos.pnl,
              pnlPercent: pos.averagePrice > 0 ? (pos.pnl / (Math.abs(pos.quantity) * pos.averagePrice)) * 100 : 0
            },
            create: {
              userId: userId,
              brokerId: account.id,
              symbol: stockSymbol,
              exchange: pos.exchange as any,
              product: pos.product || 'UNKNOWN',
              quantity: pos.quantity,
              averagePrice: pos.averagePrice,
              currentPrice: pos.currentPrice,
              pnl: pos.pnl,
              pnlPercent: pos.averagePrice > 0 ? (pos.pnl / (Math.abs(pos.quantity) * pos.averagePrice)) * 100 : 0
            }
          });
        }

        // Sync Orders
        for (const order of orders) {
          const stockSymbol = `${order.exchange}:${order.symbol}`;
          await prisma.order.upsert({
            where: {
              userId_orderId_brokerId: {
                userId: userId,
                orderId: order.orderId,
                brokerId: account.id
              }
            },
            update: {
              status: order.status,
            },
            create: {
              userId: userId,
              brokerId: account.id,
              orderId: order.orderId,
              symbol: stockSymbol,
              exchange: order.exchange as any,
              type: order.type === 'BUY' ? 'BUY' : 'SELL',
              quantity: order.quantity,
              price: order.price,
              status: order.status,
              timestamp: order.timestamp
            }
          });
        }

        // Sync Funds
        if (funds) {
          await prisma.fund.upsert({
            where: {
              userId_brokerId: {
                userId: userId,
                brokerId: account.id
              }
            },
            update: {
              availableMargin: funds.availableMargin,
              usedMargin: funds.usedMargin,
              totalBalance: funds.totalBalance
            },
            create: {
              userId: userId,
              brokerId: account.id,
              availableMargin: funds.availableMargin,
              usedMargin: funds.usedMargin,
              totalBalance: funds.totalBalance
            }
          });
        }
        
        // Update last synced timestamp
        await prisma.brokerAccount.update({
          where: { id: account.id },
          data: { lastSynced: new Date() }
        });
        
        syncResults.push({
          broker: account.brokerName,
          success: true,
          holdingsCount: holdings.length,
        });
        
      } catch (error: any) {
        console.error(`Sync failed for ${account.brokerName}:`, error);
        syncResults.push({
          broker: account.brokerName,
          success: false,
          error: error.message,
        });
        
        // Mark account as disconnected if auth failed
        if (error.message?.toLowerCase().includes('token') || error.message?.toLowerCase().includes('auth') || error.message?.toLowerCase().includes('expire')) {
          await prisma.brokerAccount.update({
            where: { id: account.id },
            data: { isConnected: false }
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      results: syncResults,
      lastSynced: new Date(),
    });
    
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
