export interface BrokerAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  userId: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  expiresIn?: number;
}

export interface Holding {
  symbol: string;          // e.g., "RELIANCE"
  exchange: string;        // "NSE" or "BSE"
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  tradingsymbol: string;   // Broker-specific symbol
  isin?: string;
  companyName?: string;
  sector?: string;
  industry?: string;
}

export interface Position {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  product: string;
}

export interface Order {
  orderId: string;
  symbol: string;
  exchange: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: string;
  timestamp: Date;
}

export interface FundInfo {
  availableMargin: number;
  usedMargin: number;
  totalBalance: number;
}

export interface BrokerAPI {
  // Authentication
  getAuthUrl(userId: string): Promise<string>;
  handleCallback(code: string, state: string): Promise<BrokerAuthResult>;
  refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult>;
  
  // Data Fetching
  getHoldings(accessToken: string): Promise<Holding[]>;
  getPositions(accessToken: string): Promise<Position[]>;
  getOrders(accessToken: string): Promise<Order[]>;
  getFunds(accessToken: string): Promise<FundInfo>;
  
  // Utility
  validateToken(accessToken: string): Promise<boolean>;
  revokeToken(accessToken: string): Promise<boolean>;
}
