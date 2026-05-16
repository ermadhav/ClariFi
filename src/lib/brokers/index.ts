// Unified Broker Interface - Plug-and-play architecture for any Indian broker
// Start with free brokers (Angel One, Upstox), add paid ones (Zerodha) later

export interface BrokerCredentials {
  clientId: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  totp?: string; // For 2FA
}

export interface BrokerHolding {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  dayChange: number;
}

export interface BrokerOrder {
  orderId: string;
  symbol: string;
  exchange: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  timestamp: Date;
}

export interface BrokerPosition {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  product: string; // CNC, MIS, etc.
}

export interface BrokerFund {
  availableMargin: number;
  usedMargin: number;
  totalBalance: number;
}

// Abstract broker interface - implement for each broker
export interface IBrokerAdapter {
  name: string;
  generateLoginUrl(credentials: BrokerCredentials): string;
  exchangeToken(requestToken: string, credentials: BrokerCredentials): Promise<{ accessToken: string; refreshToken?: string }>;
  getHoldings(accessToken: string): Promise<BrokerHolding[]>;
  getPositions(accessToken: string): Promise<BrokerPosition[]>;
  getOrders(accessToken: string): Promise<BrokerOrder[]>;
  getFunds(accessToken: string): Promise<BrokerFund>;
  placeOrder?(accessToken: string, order: Partial<BrokerOrder>): Promise<BrokerOrder>;
}

// ============================================
// ANGEL ONE (SmartAPI) - FREE
// ============================================
export class AngelOneAdapter implements IBrokerAdapter {
  name = 'Angel One';
  private baseUrl = 'https://apiconnect.angelone.in';

  generateLoginUrl(credentials: BrokerCredentials): string {
    return `${this.baseUrl}/rest/auth/angelbroking/user/v1/loginByPassword`;
  }

  async exchangeToken(requestToken: string, credentials: BrokerCredentials) {
    const response = await fetch(`${this.baseUrl}/rest/auth/angelbroking/user/v1/loginByPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': credentials.apiKey || '',
      },
      body: JSON.stringify({
        clientcode: credentials.clientId,
        password: credentials.apiSecret,
        totp: credentials.totp || '',
      }),
    });

    const data = await response.json();
    if (data.status) {
      return {
        accessToken: data.data.jwtToken,
        refreshToken: data.data.refreshToken,
      };
    }
    throw new Error(data.message || 'Angel One login failed');
  }

  async getHoldings(accessToken: string): Promise<BrokerHolding[]> {
    const response = await fetch(`${this.baseUrl}/rest/secure/angelbroking/portfolio/v1/getHolding`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': process.env.ANGEL_ONE_API_KEY || '',
      },
    });

    const data = await response.json();
    if (!data.status || !data.data) return [];

    return data.data.map((h: Record<string, unknown>) => ({
      symbol: h.tradingsymbol as string,
      exchange: h.exchange as string,
      companyName: h.symbolname as string || h.tradingsymbol as string,
      quantity: h.quantity as number,
      averagePrice: h.averageprice as number,
      lastPrice: h.ltp as number,
      pnl: h.profitandloss as number,
      dayChange: (h.ltp as number) - (h.close as number || 0),
    }));
  }

  async getPositions(accessToken: string): Promise<BrokerPosition[]> {
    const response = await fetch(`${this.baseUrl}/rest/secure/angelbroking/order/v1/getPosition`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return (data.data || []).map((p: Record<string, unknown>) => ({
      symbol: p.tradingsymbol, exchange: p.exchange,
      quantity: p.netqty, averagePrice: p.averageprice,
      lastPrice: p.ltp, pnl: p.pnl, product: p.producttype,
    }));
  }

  async getOrders(accessToken: string): Promise<BrokerOrder[]> {
    const response = await fetch(`${this.baseUrl}/rest/secure/angelbroking/order/v1/getOrderBook`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return (data.data || []).map((o: Record<string, unknown>) => ({
      orderId: o.orderid, symbol: o.tradingsymbol, exchange: o.exchange,
      type: o.transactiontype, quantity: o.quantity, price: o.price,
      status: o.orderstatus, timestamp: new Date(o.updatetime as string),
    }));
  }

  async getFunds(accessToken: string): Promise<BrokerFund> {
    const response = await fetch(`${this.baseUrl}/rest/secure/angelbroking/user/v1/getRMS`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return {
      availableMargin: data.data?.availablecash || 0,
      usedMargin: data.data?.utiliseddebits || 0,
      totalBalance: data.data?.net || 0,
    };
  }
}

// ============================================
// UPSTOX (API v2) - FREE
// ============================================
export class UpstoxAdapter implements IBrokerAdapter {
  name = 'Upstox';
  private baseUrl = 'https://api.upstox.com/v2';

  generateLoginUrl(credentials: BrokerCredentials): string {
    return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${credentials.apiKey}&redirect_uri=${encodeURIComponent(process.env.UPSTOX_REDIRECT_URI || 'http://localhost:3000/api/broker/upstox/callback')}`;
  }

  async exchangeToken(requestToken: string, credentials: BrokerCredentials) {
    const response = await fetch(`${this.baseUrl}/login/authorization/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: requestToken,
        client_id: credentials.apiKey || '',
        client_secret: credentials.apiSecret || '',
        redirect_uri: process.env.UPSTOX_REDIRECT_URI || 'http://localhost:3000/api/broker/upstox/callback',
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    return { accessToken: data.access_token, refreshToken: data.refresh_token };
  }

  async getHoldings(accessToken: string): Promise<BrokerHolding[]> {
    const response = await fetch(`${this.baseUrl}/portfolio/long-term-holdings`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });

    const data = await response.json();
    return (data.data || []).map((h: Record<string, unknown>) => ({
      symbol: h.tradingsymbol as string,
      exchange: h.exchange as string,
      companyName: h.company_name as string || h.tradingsymbol as string,
      quantity: h.quantity as number,
      averagePrice: h.average_price as number,
      lastPrice: h.last_price as number,
      pnl: h.pnl as number,
      dayChange: (h.day_change as number) || 0,
    }));
  }

  async getPositions(accessToken: string): Promise<BrokerPosition[]> {
    const response = await fetch(`${this.baseUrl}/portfolio/short-term-positions`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });
    const data = await response.json();
    return (data.data || []).map((p: Record<string, unknown>) => ({
      symbol: p.tradingsymbol, exchange: p.exchange, quantity: p.quantity,
      averagePrice: p.average_price, lastPrice: p.last_price, pnl: p.pnl, product: p.product,
    }));
  }

  async getOrders(accessToken: string): Promise<BrokerOrder[]> {
    const response = await fetch(`${this.baseUrl}/order/retrieve-all`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });
    const data = await response.json();
    return (data.data || []).map((o: Record<string, unknown>) => ({
      orderId: o.order_id, symbol: o.tradingsymbol, exchange: o.exchange,
      type: o.transaction_type, quantity: o.quantity, price: o.price,
      status: o.status, timestamp: new Date(o.order_timestamp as string),
    }));
  }

  async getFunds(accessToken: string): Promise<BrokerFund> {
    const response = await fetch(`${this.baseUrl}/user/get-funds-and-margin`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });
    const data = await response.json();
    const equity = data.data?.equity || {};
    return {
      availableMargin: equity.available_margin || 0,
      usedMargin: equity.used_margin || 0,
      totalBalance: (equity.available_margin || 0) + (equity.used_margin || 0),
    };
  }
}

// ============================================
// BROKER FACTORY
// ============================================
export function getBrokerAdapter(broker: string): IBrokerAdapter {
  switch (broker.toUpperCase()) {
    case 'ANGEL_ONE': return new AngelOneAdapter();
    case 'UPSTOX': return new UpstoxAdapter();
    default: throw new Error(`Broker ${broker} not supported yet`);
  }
}

// Manual entry "adapter" - just passes data through
export class ManualEntryAdapter implements IBrokerAdapter {
  name = 'Manual Entry';
  generateLoginUrl(): string { return ''; }
  async exchangeToken() { return { accessToken: 'manual' }; }
  async getHoldings(): Promise<BrokerHolding[]> { return []; }
  async getPositions(): Promise<BrokerPosition[]> { return []; }
  async getOrders(): Promise<BrokerOrder[]> { return []; }
  async getFunds(): Promise<BrokerFund> { return { availableMargin: 0, usedMargin: 0, totalBalance: 0 }; }
}
