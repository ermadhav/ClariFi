export interface Holding {
  id: string;
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  industry: string;
  marketCap: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MICRO_CAP';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  totalInvested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
  logo?: string;
  high52w: number;
  low52w: number;
  pe: number;
  pb: number;
  dividendYield: number;
  beta: number;
  volume: number;
  avgVolume: number;
  firstBoughtDate: string;
}

export interface Transaction {
  id: string;
  symbol: string;
  companyName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  brokerage: number;
  date: string;
  broker: string;
  notes?: string;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  sector: string;
  marketCap: string;
  pe: number;
  sparklineData: number[];
  high52w: number;
  low52w: number;
}

export interface Watchlist {
  id: string;
  name: string;
  color: string;
  stocks: WatchlistItem[];
  isDefault: boolean;
}

export interface NewsItem {
  id: string;
  headline: string;
  snippet: string;
  source: string;
  sourceIcon?: string;
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedStocks: string[];
  imageUrl?: string;
  url: string;
  bookmarked: boolean;
}

export interface Alert {
  id: string;
  symbol: string;
  companyName: string;
  type: 'PRICE_TARGET' | 'PERCENTAGE_CHANGE' | 'VOLUME' | '52W_HIGH' | '52W_LOW' | 'EVENT';
  condition: string;
  targetPrice?: number;
  percentageChange?: number;
  isActive: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface DividendRecord {
  id: string;
  symbol: string;
  companyName: string;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  dividendPerShare: number;
  quantityHeld: number;
  totalDividend: number;
  tdsDeducted: number;
  netAmount: number;
  financialYear: string;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface SectorPerformance {
  name: string;
  change: number;
  stocks: number;
  topGainer: string;
  topLoser: string;
}

export interface StockDetail extends Holding {
  description: string;
  roe: number;
  roce: number;
  debtToEquity: number;
  currentRatio: number;
  promoterHolding: number;
  fiiHolding: number;
  diiHolding: number;
  bookValue: number;
  faceValue: number;
  eps: number;
  revenue: number[];
  netProfit: number[];
  quarters: string[];
}

export interface CapitalGain {
  id: string;
  symbol: string;
  companyName: string;
  buyDate: string;
  sellDate: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  holdingPeriod: number;
  gain: number;
  type: 'STCG' | 'LTCG';
  tax: number;
}

export interface MutualFund {
  id: string;
  fundName: string;
  fundCode: string;
  category: string;
  amc: string;
  units: number;
  averageNav: number;
  currentNav: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  xirr: number;
  sipAmount?: number;
  sipFrequency?: string;
  nextSipDate?: string;
  rating: number;
  expenseRatio: number;
}

export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
export type BreakdownView = 'sector' | 'industry' | 'marketCap' | 'broker';
