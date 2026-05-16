import axios from 'axios';
import { BrokerAPI, BrokerAuthResult, TokenRefreshResult, Holding, Position, Order, FundInfo } from './base-broker';

export class AngelOneAPI implements BrokerAPI {
  private apiKey: string;
  private baseUrl = 'https://apiconnect.angelbroking.com';
  
  constructor() {
    this.apiKey = process.env.ANGELONE_API_KEY || '';
  }
  
  async getAuthUrl(userId: string): Promise<string> {
    // Angel One doesn't use standard OAuth redirect for this flow, it expects credentials
    return `/settings/brokers/angelone-login?userId=${userId}`;
  }

  async handleCallback(code: string, state: string): Promise<BrokerAuthResult> {
    throw new Error('Angel One uses credential-based auth, use authenticateUser instead.');
  }

  async authenticateUser(clientId: string, password: string, totp: string): Promise<BrokerAuthResult> {
    if (!this.apiKey) throw new Error("ANGELONE_API_KEY is not set");
    
    const response = await axios.post(`${this.baseUrl}/rest/auth/angelbroking/user/v1/loginByPassword`, {
      clientcode: clientId,
      password: password,
      totp: totp,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': this.apiKey,
      }
    });
    
    if (!response.data.status) {
      throw new Error(response.data.message || 'Angel One login failed');
    }
    
    return {
      accessToken: response.data.data.jwtToken,
      refreshToken: response.data.data.refreshToken,
      userId: clientId, // Using clientId as the userId reference for this specific broker connection
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
    // Angel One uses /renew API
    const response = await axios.post(`${this.baseUrl}/rest/auth/angelbroking/jwt/v1/generateTokens`, {
      refreshToken: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': this.apiKey,
        'Authorization': `Bearer ${refreshToken}`, // API docs say pass refreshToken as Bearer
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Token refresh failed');
    }

    return {
      accessToken: response.data.data.jwtToken,
    };
  }
  
  async getHoldings(accessToken: string): Promise<Holding[]> {
    const response = await axios.get(`${this.baseUrl}/rest/secure/angelbroking/portfolio/v1/getHolding`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': this.apiKey,
      }
    });
    
    if (!response.data.data) return [];
    
    return response.data.data.map((item: any) => ({
      symbol: item.tradingsymbol,
      exchange: item.exchange,
      quantity: item.quantity,
      averagePrice: item.averageprice,
      currentPrice: item.ltp,
      pnl: item.profitandloss,
      pnlPercentage: item.pnlpercentage,
      tradingsymbol: item.tradingsymbol,
      isin: item.isin,
      companyName: item.symbolname || item.tradingsymbol,
    }));
  }

  async getPositions(accessToken: string): Promise<Position[]> {
    const response = await axios.get(`${this.baseUrl}/rest/secure/angelbroking/order/v1/getPosition`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': this.apiKey,
      }
    });
    
    if (!response.data.data) return [];
    
    return response.data.data.map((item: any) => ({
      symbol: item.tradingsymbol,
      exchange: item.exchange,
      quantity: item.netqty,
      averagePrice: item.averageprice,
      currentPrice: item.ltp,
      pnl: item.pnl,
      product: item.producttype,
    }));
  }

  async getOrders(accessToken: string): Promise<Order[]> {
    const response = await axios.get(`${this.baseUrl}/rest/secure/angelbroking/order/v1/getOrderBook`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': this.apiKey,
      }
    });
    
    if (!response.data.data) return [];
    
    return response.data.data.map((item: any) => ({
      orderId: item.orderid,
      symbol: item.tradingsymbol,
      exchange: item.exchange,
      type: item.transactiontype,
      quantity: item.quantity,
      price: item.price,
      status: item.orderstatus,
      timestamp: new Date(item.updatetime),
    }));
  }

  async getFunds(accessToken: string): Promise<FundInfo> {
    const response = await axios.get(`${this.baseUrl}/rest/secure/angelbroking/user/v1/getRMS`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': this.apiKey,
      }
    });
    
    const data = response.data.data;
    return {
      availableMargin: parseFloat(data?.availablecash || '0'),
      usedMargin: parseFloat(data?.utiliseddebits || '0'),
      totalBalance: parseFloat(data?.net || '0'),
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/rest/secure/angelbroking/user/v1/getProfile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00',
          'X-PrivateKey': this.apiKey,
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/rest/secure/angelbroking/user/v1/logout`, {
        clientcode: "USER" // Angel One requires client code for logout
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00',
          'X-PrivateKey': this.apiKey,
        }
      });
      return true;
    } catch {
      return false;
    }
  }
}
