import axios from 'axios';
import crypto from 'crypto';
import { BrokerAPI, BrokerAuthResult, TokenRefreshResult, Holding, Position, Order, FundInfo } from './base-broker';
import prisma from '@/lib/prisma';

export class UpstoxAPI implements BrokerAPI {
  private apiKey: string;
  private apiSecret: string;
  private redirectUri: string;
  private baseUrl = 'https://api.upstox.com/v2';
  
  constructor() {
    this.apiKey = process.env.UPSTOX_API_KEY || '';
    this.apiSecret = process.env.UPSTOX_API_SECRET || '';
    this.redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/brokers/upstox/callback`;
  }
  
  async getAuthUrl(userId: string): Promise<string> {
    if (!this.apiKey) throw new Error("UPSTOX_API_KEY is not set");
    
    const state = crypto.randomBytes(16).toString('hex');
    await prisma.brokerAuthState.create({
      data: { userId, state, broker: 'UPSTOX', expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
    });
    
    return `${this.baseUrl}/login/authorization/dialog?client_id=${this.apiKey}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}&response_type=code`;
  }
  
  async handleCallback(code: string, state: string): Promise<BrokerAuthResult> {
    // Verify state
    const authState = await prisma.brokerAuthState.findUnique({ where: { state } });
    if (!authState || authState.expiresAt < new Date()) {
      throw new Error('Invalid or expired state');
    }
    
    // Exchange code for tokens
    const response = await axios.post(`${this.baseUrl}/login/authorization/token`, new URLSearchParams({
      code,
      client_id: this.apiKey,
      client_secret: this.apiSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
    });
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    await prisma.brokerAuthState.delete({ where: { state } });
    
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      userId: authState.userId,
    };
  }
  
  async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
    const response = await axios.post(`${this.baseUrl}/login/authorization/token`, new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.apiKey,
      client_secret: this.apiSecret,
      grant_type: 'refresh_token',
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
    });
    
    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }
  
  async getHoldings(accessToken: string): Promise<Holding[]> {
    const response = await axios.get(`${this.baseUrl}/portfolio/long-term-holdings`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    
    if (!response.data.data) return [];
    
    return response.data.data.map((item: any) => ({
      symbol: item.tradingsymbol,
      exchange: item.exchange,
      quantity: item.quantity,
      averagePrice: item.average_price,
      currentPrice: item.last_price,
      pnl: item.pnl,
      pnlPercentage: item.pnl_percentage,
      tradingsymbol: item.tradingsymbol,
      isin: item.isin,
      companyName: item.company_name || item.tradingsymbol,
    }));
  }

  async getPositions(accessToken: string): Promise<Position[]> {
    const response = await axios.get(`${this.baseUrl}/portfolio/short-term-positions`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    
    if (!response.data.data) return [];
    
    return response.data.data.map((item: any) => ({
      symbol: item.tradingsymbol,
      exchange: item.exchange,
      quantity: item.quantity,
      averagePrice: item.average_price,
      currentPrice: item.last_price,
      pnl: item.pnl,
      product: item.product,
    }));
  }

  async getOrders(accessToken: string): Promise<Order[]> {
    const response = await axios.get(`${this.baseUrl}/order/retrieve-all`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    
    if (!response.data.data) return [];
    
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
  }

  async getFunds(accessToken: string): Promise<FundInfo> {
    const response = await axios.get(`${this.baseUrl}/user/get-funds-and-margin`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    
    const equity = response.data.data?.equity;
    return {
      availableMargin: equity?.available_margin || 0,
      usedMargin: equity?.used_margin || 0,
      totalBalance: (equity?.available_margin || 0) + (equity?.used_margin || 0),
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/user/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
      });
      return true;
    } catch {
      return false;
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/logout`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
      });
      return true;
    } catch {
      return false;
    }
  }
}
