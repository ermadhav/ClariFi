import axios from 'axios';
import crypto from 'crypto';
import { BrokerAPI, BrokerAuthResult, TokenRefreshResult, Holding, Position, Order, FundInfo } from './base-broker';
import prisma from '@/lib/prisma';

export class ZerodhaAPI implements BrokerAPI {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.kite.trade';
  
  constructor() {
    this.apiKey = process.env.ZERODHA_API_KEY || '';
    this.apiSecret = process.env.ZERODHA_API_SECRET || '';
  }
  
  async getAuthUrl(userId: string): Promise<string> {
    if (!this.apiKey) throw new Error("ZERODHA_API_KEY is not set");
    
    // Generate state token for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in database linked to userId for verification
    await prisma.brokerAuthState.create({
      data: { userId, state, broker: 'ZERODHA', expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
    });
    
    return `https://kite.zerodha.com/connect/login?api_key=${this.apiKey}&v=3&state=${state}`;
  }
  
  async handleCallback(requestToken: string, state: string): Promise<BrokerAuthResult> {
    // Verify state token
    const authState = await prisma.brokerAuthState.findUnique({ where: { state } });
    if (!authState || authState.expiresAt < new Date()) {
      throw new Error('Invalid or expired state token');
    }
    
    // Generate checksum: api_key + request_token + api_secret
    const checksum = crypto
      .createHash('sha256')
      .update(this.apiKey + requestToken + this.apiSecret)
      .digest('hex');
    
    // Exchange request token for access token
    const response = await axios.post(`${this.baseUrl}/session/token`, {
      api_key: this.apiKey,
      request_token: requestToken,
      checksum: checksum,
    }, {
      headers: {
        'X-Kite-Version': '3',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token } = response.data.data;
    
    // Clean up state token
    await prisma.brokerAuthState.delete({ where: { state } });
    
    return {
      accessToken: access_token,
      userId: authState.userId,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
    throw new Error('Zerodha does not support refresh tokens. User must login daily.');
  }
  
  async getHoldings(accessToken: string): Promise<Holding[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/portfolio/holdings`, {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${accessToken}`
        }
      });
      
      // Transform Zerodha format to our standard format
      return response.data.data.map((item: any) => ({
        symbol: item.tradingsymbol,
        exchange: item.exchange,
        quantity: item.quantity,
        averagePrice: item.average_price,
        currentPrice: item.last_price,
        pnl: item.pnl,
        pnlPercentage: item.average_price > 0 ? ((item.last_price - item.average_price) / item.average_price) * 100 : 0,
        tradingsymbol: item.tradingsymbol,
        isin: item.isin,
        companyName: item.tradingsymbol, // Zerodha doesn't provide full name
      }));
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access token expired. Please reconnect your Zerodha account.');
      }
      throw error;
    }
  }

  async getPositions(accessToken: string): Promise<Position[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/portfolio/positions`, {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${accessToken}`
        }
      });
      
      const positions = [...(response.data.data.net || []), ...(response.data.data.day || [])];
      
      return positions.map((item: any) => ({
        symbol: item.tradingsymbol,
        exchange: item.exchange,
        quantity: item.quantity,
        averagePrice: item.average_price,
        currentPrice: item.last_price,
        pnl: item.pnl,
        product: item.product,
      }));
    } catch (error: any) {
      throw error;
    }
  }

  async getOrders(accessToken: string): Promise<Order[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/orders`, {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${accessToken}`
        }
      });
      
      return response.data.data.map((item: any) => ({
        orderId: item.order_id,
        symbol: item.tradingsymbol,
        exchange: item.exchange,
        type: item.transaction_type,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        timestamp: new Date(item.order_timestamp),
      }));
    } catch (error: any) {
      throw error;
    }
  }

  async getFunds(accessToken: string): Promise<FundInfo> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/margins`, {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${accessToken}`
        }
      });
      
      const equity = response.data.data.equity;
      return {
        availableMargin: equity.available.live_balance,
        usedMargin: equity.utilised.debits,
        totalBalance: equity.net,
      };
    } catch (error: any) {
      throw error;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/user/profile`, {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${accessToken}`
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/session/token`, {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${accessToken}`
        },
        params: {
          api_key: this.apiKey,
          access_token: accessToken,
        }
      });
      return true;
    } catch {
      return false;
    }
  }
}
