import { Holding, Transaction, WatchlistItem, NewsItem, MarketIndex, SectorPerformance, DividendRecord, CapitalGain, MutualFund, Alert } from '@/types';

export const mockHoldings: Holding[] = [
  { id: '1', symbol: 'RELIANCE', companyName: 'Reliance Industries', exchange: 'NSE', sector: 'Energy', industry: 'Oil & Gas', marketCap: 'LARGE_CAP', quantity: 25, averagePrice: 2380, currentPrice: 2642.50, previousClose: 2618.30, dayChange: 24.20, dayChangePercent: 0.92, totalInvested: 59500, currentValue: 66062.50, pnl: 6562.50, pnlPercent: 11.03, weight: 18.2, high52w: 3024, low52w: 2220, pe: 28.5, pb: 2.1, dividendYield: 0.3, beta: 1.1, volume: 8500000, avgVolume: 7200000, firstBoughtDate: '2024-03-15' },
  { id: '2', symbol: 'TCS', companyName: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT', industry: 'IT Services', marketCap: 'LARGE_CAP', quantity: 15, averagePrice: 3450, currentPrice: 3812.75, previousClose: 3790.50, dayChange: 22.25, dayChangePercent: 0.59, totalInvested: 51750, currentValue: 57191.25, pnl: 5441.25, pnlPercent: 10.51, weight: 15.7, high52w: 4246, low52w: 3056, pe: 31.2, pb: 13.5, dividendYield: 1.2, beta: 0.7, volume: 3200000, avgVolume: 2800000, firstBoughtDate: '2024-01-10' },
  { id: '3', symbol: 'HDFCBANK', companyName: 'HDFC Bank', exchange: 'NSE', sector: 'Banking', industry: 'Private Banks', marketCap: 'LARGE_CAP', quantity: 40, averagePrice: 1520, currentPrice: 1685.40, previousClose: 1698.20, dayChange: -12.80, dayChangePercent: -0.75, totalInvested: 60800, currentValue: 67416.00, pnl: 6616.00, pnlPercent: 10.88, weight: 18.6, high52w: 1880, low52w: 1363, pe: 19.8, pb: 2.8, dividendYield: 1.1, beta: 0.9, volume: 12000000, avgVolume: 10500000, firstBoughtDate: '2023-11-20' },
  { id: '4', symbol: 'INFY', companyName: 'Infosys', exchange: 'NSE', sector: 'IT', industry: 'IT Services', marketCap: 'LARGE_CAP', quantity: 30, averagePrice: 1380, currentPrice: 1542.60, previousClose: 1530.45, dayChange: 12.15, dayChangePercent: 0.79, totalInvested: 41400, currentValue: 46278.00, pnl: 4878.00, pnlPercent: 11.78, weight: 12.8, high52w: 1972, low52w: 1286, pe: 27.4, pb: 8.2, dividendYield: 2.4, beta: 0.8, volume: 6800000, avgVolume: 5900000, firstBoughtDate: '2024-02-05' },
  { id: '5', symbol: 'BHARTIARTL', companyName: 'Bharti Airtel', exchange: 'NSE', sector: 'Telecom', industry: 'Telecom Services', marketCap: 'LARGE_CAP', quantity: 20, averagePrice: 1180, currentPrice: 1456.30, previousClose: 1442.80, dayChange: 13.50, dayChangePercent: 0.94, totalInvested: 23600, currentValue: 29126.00, pnl: 5526.00, pnlPercent: 23.41, weight: 8.0, high52w: 1779, low52w: 1016, pe: 76.3, pb: 9.4, dividendYield: 0.5, beta: 0.6, volume: 4500000, avgVolume: 3800000, firstBoughtDate: '2024-04-12' },
  { id: '6', symbol: 'ICICIBANK', companyName: 'ICICI Bank', exchange: 'NSE', sector: 'Banking', industry: 'Private Banks', marketCap: 'LARGE_CAP', quantity: 50, averagePrice: 980, currentPrice: 1238.90, previousClose: 1245.60, dayChange: -6.70, dayChangePercent: -0.54, totalInvested: 49000, currentValue: 61945.00, pnl: 12945.00, pnlPercent: 26.42, weight: 17.1, high52w: 1362, low52w: 932, pe: 18.2, pb: 3.1, dividendYield: 0.8, beta: 1.0, volume: 15000000, avgVolume: 13000000, firstBoughtDate: '2023-09-08' },
  { id: '7', symbol: 'WIPRO', companyName: 'Wipro', exchange: 'NSE', sector: 'IT', industry: 'IT Services', marketCap: 'LARGE_CAP', quantity: 100, averagePrice: 485, currentPrice: 462.35, previousClose: 468.90, dayChange: -6.55, dayChangePercent: -1.40, totalInvested: 48500, currentValue: 46235.00, pnl: -2265.00, pnlPercent: -4.67, weight: 12.7, high52w: 576, low52w: 390, pe: 23.1, pb: 3.6, dividendYield: 0.2, beta: 0.9, volume: 9200000, avgVolume: 8000000, firstBoughtDate: '2024-06-20' },
  { id: '8', symbol: 'TATAMOTORS', companyName: 'Tata Motors', exchange: 'NSE', sector: 'Auto', industry: 'Automobiles', marketCap: 'LARGE_CAP', quantity: 60, averagePrice: 720, currentPrice: 788.45, previousClose: 775.20, dayChange: 13.25, dayChangePercent: 1.71, totalInvested: 43200, currentValue: 47307.00, pnl: 4107.00, pnlPercent: 9.51, weight: 13.0, high52w: 1065, low52w: 610, pe: 8.5, pb: 3.8, dividendYield: 0.6, beta: 1.5, volume: 18000000, avgVolume: 15000000, firstBoughtDate: '2024-05-01' },
  { id: '9', symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical', exchange: 'NSE', sector: 'Pharma', industry: 'Pharmaceuticals', marketCap: 'LARGE_CAP', quantity: 35, averagePrice: 1620, currentPrice: 1748.20, previousClose: 1735.90, dayChange: 12.30, dayChangePercent: 0.71, totalInvested: 56700, currentValue: 61187.00, pnl: 4487.00, pnlPercent: 7.92, weight: 16.9, high52w: 1960, low52w: 1358, pe: 38.2, pb: 6.1, dividendYield: 0.5, beta: 0.5, volume: 3500000, avgVolume: 3000000, firstBoughtDate: '2024-07-15' },
  { id: '10', symbol: 'ASIANPAINT', companyName: 'Asian Paints', exchange: 'NSE', sector: 'FMCG', industry: 'Paints', marketCap: 'LARGE_CAP', quantity: 18, averagePrice: 2850, currentPrice: 2412.60, previousClose: 2435.80, dayChange: -23.20, dayChangePercent: -0.95, totalInvested: 51300, currentValue: 43426.80, pnl: -7873.20, pnlPercent: -15.35, weight: 12.0, high52w: 3395, low52w: 2274, pe: 52.4, pb: 14.2, dividendYield: 0.8, beta: 0.7, volume: 2100000, avgVolume: 1800000, firstBoughtDate: '2024-02-28' },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', symbol: 'RELIANCE', companyName: 'Reliance Industries', type: 'BUY', quantity: 10, pricePerShare: 2350, totalAmount: 23500, brokerage: 14.10, date: '2024-03-15', broker: 'Zerodha', notes: 'Long term hold' },
  { id: 't2', symbol: 'TCS', companyName: 'Tata Consultancy Services', type: 'BUY', quantity: 15, pricePerShare: 3450, totalAmount: 51750, brokerage: 31.05, date: '2024-01-10', broker: 'Zerodha' },
  { id: 't3', symbol: 'HDFCBANK', companyName: 'HDFC Bank', type: 'BUY', quantity: 40, pricePerShare: 1520, totalAmount: 60800, brokerage: 36.48, date: '2023-11-20', broker: 'Groww' },
  { id: 't4', symbol: 'RELIANCE', companyName: 'Reliance Industries', type: 'BUY', quantity: 15, pricePerShare: 2400, totalAmount: 36000, brokerage: 21.60, date: '2024-06-10', broker: 'Zerodha' },
  { id: 't5', symbol: 'INFY', companyName: 'Infosys', type: 'BUY', quantity: 30, pricePerShare: 1380, totalAmount: 41400, brokerage: 24.84, date: '2024-02-05', broker: 'Upstox' },
  { id: 't6', symbol: 'TATASTEEL', companyName: 'Tata Steel', type: 'BUY', quantity: 200, pricePerShare: 125, totalAmount: 25000, brokerage: 15.00, date: '2024-01-15', broker: 'Zerodha' },
  { id: 't7', symbol: 'TATASTEEL', companyName: 'Tata Steel', type: 'SELL', quantity: 200, pricePerShare: 142, totalAmount: 28400, brokerage: 17.04, date: '2024-08-20', broker: 'Zerodha', notes: 'Booked profit' },
  { id: 't8', symbol: 'BHARTIARTL', companyName: 'Bharti Airtel', type: 'BUY', quantity: 20, pricePerShare: 1180, totalAmount: 23600, brokerage: 14.16, date: '2024-04-12', broker: 'Groww' },
  { id: 't9', symbol: 'ICICIBANK', companyName: 'ICICI Bank', type: 'BUY', quantity: 50, pricePerShare: 980, totalAmount: 49000, brokerage: 29.40, date: '2023-09-08', broker: 'Zerodha' },
  { id: 't10', symbol: 'WIPRO', companyName: 'Wipro', type: 'BUY', quantity: 100, pricePerShare: 485, totalAmount: 48500, brokerage: 29.10, date: '2024-06-20', broker: 'Upstox' },
];

export const mockWatchlistStocks: WatchlistItem[] = [
  { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance', currentPrice: 7245.80, dayChange: 85.30, dayChangePercent: 1.19, sector: 'NBFC', marketCap: 'LARGE_CAP', pe: 32.4, sparklineData: [100,102,99,103,105,104,108,107,110,112,109,113,115,114,118,116,119,120,122,121], high52w: 8192, low52w: 5950 },
  { symbol: 'MARUTI', companyName: 'Maruti Suzuki', currentPrice: 12450.60, dayChange: -156.40, dayChangePercent: -1.24, sector: 'Auto', marketCap: 'LARGE_CAP', pe: 26.8, sparklineData: [120,118,122,119,116,118,115,117,114,116,113,115,112,114,111,113,110,112,109,111], high52w: 13680, low52w: 9830 },
  { symbol: 'LTIM', companyName: 'LTIMindtree', currentPrice: 5234.90, dayChange: 42.60, dayChangePercent: 0.82, sector: 'IT', marketCap: 'LARGE_CAP', pe: 34.1, sparklineData: [100,98,101,103,100,104,102,106,104,108,106,110,108,112,110,114,112,116,114,118], high52w: 6420, low52w: 4280 },
  { symbol: 'ADANIENT', companyName: 'Adani Enterprises', currentPrice: 2856.40, dayChange: 34.20, dayChangePercent: 1.21, sector: 'Conglomerate', marketCap: 'LARGE_CAP', pe: 72.5, sparklineData: [100,105,102,108,104,110,106,112,108,114,110,116,112,118,114,120,116,122,118,124], high52w: 3490, low52w: 2050 },
  { symbol: 'TITAN', companyName: 'Titan Company', currentPrice: 3456.80, dayChange: -28.50, dayChangePercent: -0.82, sector: 'Consumer', marketCap: 'LARGE_CAP', pe: 62.3, sparklineData: [110,108,112,106,110,104,108,102,106,100,104,98,102,96,100,94,98,92,96,94], high52w: 3886, low52w: 2945 },
  { symbol: 'NESTLEIND', companyName: 'Nestle India', currentPrice: 2345.20, dayChange: 15.80, dayChangePercent: 0.68, sector: 'FMCG', marketCap: 'LARGE_CAP', pe: 72.8, sparklineData: [100,101,99,102,100,103,101,104,102,105,103,106,104,107,105,108,106,109,107,110], high52w: 2778, low52w: 2056 },
];

export const mockNews: NewsItem[] = [
  { id: 'n1', headline: 'Reliance Industries Q4 Results: Net Profit Rises 12% YoY to ₹19,407 Crore', snippet: 'Reliance Industries reported a 12% year-on-year increase in consolidated net profit for Q4 FY25, driven by strong performance in retail and digital services.', source: 'Moneycontrol', timestamp: new Date(Date.now() - 2 * 3600000), sentiment: 'positive', relatedStocks: ['RELIANCE'], url: '#', bookmarked: false },
  { id: 'n2', headline: 'TCS Wins $2.5 Billion Mega Deal from European Financial Institution', snippet: 'Tata Consultancy Services has bagged one of its largest ever deals worth $2.5 billion from a leading European bank for digital transformation.', source: 'Economic Times', timestamp: new Date(Date.now() - 5 * 3600000), sentiment: 'positive', relatedStocks: ['TCS'], url: '#', bookmarked: true },
  { id: 'n3', headline: 'HDFC Bank Asset Quality Under Pressure as NPAs Rise Marginally', snippet: 'HDFC Bank reported a marginal increase in gross NPAs in Q4, raising concerns about asset quality in the merged entity.', source: 'Livemint', timestamp: new Date(Date.now() - 8 * 3600000), sentiment: 'negative', relatedStocks: ['HDFCBANK'], url: '#', bookmarked: false },
  { id: 'n4', headline: 'Nifty 50 Hits All-Time High of 25,200; Banking Stocks Lead Rally', snippet: 'The benchmark Nifty 50 index crossed the 25,200 mark for the first time, driven by strong buying in banking and financial stocks.', source: 'NDTV Profit', timestamp: new Date(Date.now() - 12 * 3600000), sentiment: 'positive', relatedStocks: [], url: '#', bookmarked: false },
  { id: 'n5', headline: 'Wipro Issues Cautious Guidance for Q1 FY26; Stock Under Pressure', snippet: 'Wipro has given a cautious revenue guidance for Q1 FY26, citing macroeconomic uncertainties and delayed deal closures in key markets.', source: 'Business Standard', timestamp: new Date(Date.now() - 18 * 3600000), sentiment: 'negative', relatedStocks: ['WIPRO'], url: '#', bookmarked: false },
  { id: 'n6', headline: 'Bharti Airtel Tariff Hike Expected in Q2; ARPU to Cross ₹250', snippet: 'Analysts expect Bharti Airtel to announce another round of tariff hikes in Q2, which could push its ARPU beyond the ₹250 mark.', source: 'Moneycontrol', timestamp: new Date(Date.now() - 24 * 3600000), sentiment: 'positive', relatedStocks: ['BHARTIARTL'], url: '#', bookmarked: false },
];

export const mockIndices: MarketIndex[] = [
  { name: 'NIFTY 50', value: 25180.75, change: 142.30, changePercent: 0.57, sparkline: [24800,24850,24920,24980,25020,25080,25050,25100,25140,25180] },
  { name: 'SENSEX', value: 82645.20, change: 468.50, changePercent: 0.57, sparkline: [81900,82000,82150,82300,82400,82500,82450,82550,82600,82645] },
  { name: 'BANK NIFTY', value: 52340.60, change: -185.40, changePercent: -0.35, sparkline: [52600,52550,52480,52420,52380,52350,52400,52370,52360,52340] },
  { name: 'NIFTY MIDCAP', value: 48920.30, change: 312.80, changePercent: 0.64, sparkline: [48500,48550,48620,48700,48750,48800,48850,48880,48900,48920] },
  { name: 'NIFTY IT', value: 38450.10, change: 225.60, changePercent: 0.59, sparkline: [38100,38150,38200,38280,38320,38380,38400,38420,38440,38450] },
];

export const mockSectors: SectorPerformance[] = [
  { name: 'IT', change: 1.24, stocks: 15, topGainer: 'LTIM', topLoser: 'WIPRO' },
  { name: 'Banking', change: -0.45, stocks: 12, topGainer: 'SBIN', topLoser: 'HDFCBANK' },
  { name: 'Auto', change: 1.85, stocks: 10, topGainer: 'TATAMOTORS', topLoser: 'MARUTI' },
  { name: 'Pharma', change: 0.72, stocks: 8, topGainer: 'SUNPHARMA', topLoser: 'DRREDDY' },
  { name: 'Energy', change: 0.58, stocks: 6, topGainer: 'RELIANCE', topLoser: 'ONGC' },
  { name: 'FMCG', change: -0.92, stocks: 9, topGainer: 'NESTLEIND', topLoser: 'ASIANPAINT' },
  { name: 'Metals', change: 2.15, stocks: 7, topGainer: 'TATASTEEL', topLoser: 'HINDALCO' },
  { name: 'Telecom', change: 0.94, stocks: 4, topGainer: 'BHARTIARTL', topLoser: 'IDEA' },
  { name: 'Realty', change: -1.32, stocks: 5, topGainer: 'DLF', topLoser: 'GODREJPROP' },
  { name: 'Media', change: 0.45, stocks: 4, topGainer: 'ZEEL', topLoser: 'PVR' },
];

export const mockDividends: DividendRecord[] = [
  { id: 'd1', symbol: 'TCS', companyName: 'Tata Consultancy Services', exDate: '2025-01-15', recordDate: '2025-01-17', paymentDate: '2025-02-05', dividendPerShare: 28, quantityHeld: 15, totalDividend: 420, tdsDeducted: 42, netAmount: 378, financialYear: 'FY2024-25' },
  { id: 'd2', symbol: 'INFY', companyName: 'Infosys', exDate: '2025-02-20', recordDate: '2025-02-22', paymentDate: '2025-03-10', dividendPerShare: 18, quantityHeld: 30, totalDividend: 540, tdsDeducted: 54, netAmount: 486, financialYear: 'FY2024-25' },
  { id: 'd3', symbol: 'HDFCBANK', companyName: 'HDFC Bank', exDate: '2025-05-10', recordDate: '2025-05-12', paymentDate: '2025-06-01', dividendPerShare: 19.5, quantityHeld: 40, totalDividend: 780, tdsDeducted: 78, netAmount: 702, financialYear: 'FY2024-25' },
  { id: 'd4', symbol: 'ICICIBANK', companyName: 'ICICI Bank', exDate: '2025-06-15', recordDate: '2025-06-17', paymentDate: '2025-07-05', dividendPerShare: 10, quantityHeld: 50, totalDividend: 500, tdsDeducted: 50, netAmount: 450, financialYear: 'FY2025-26' },
];

export const mockCapitalGains: CapitalGain[] = [
  { id: 'cg1', symbol: 'TATASTEEL', companyName: 'Tata Steel', buyDate: '2024-01-15', sellDate: '2024-08-20', quantity: 200, buyPrice: 125, sellPrice: 142, holdingPeriod: 218, gain: 3400, type: 'STCG', tax: 680 },
  { id: 'cg2', symbol: 'SBIN', companyName: 'State Bank of India', buyDate: '2023-03-10', sellDate: '2024-09-15', quantity: 100, buyPrice: 540, sellPrice: 820, holdingPeriod: 555, gain: 28000, type: 'LTCG', tax: 3375 },
];

export const mockMutualFunds: MutualFund[] = [
  { id: 'mf1', fundName: 'Axis Bluechip Fund - Growth', fundCode: '120503', category: 'Large Cap', amc: 'Axis AMC', units: 245.32, averageNav: 48.50, currentNav: 56.80, invested: 11898, currentValue: 13934.18, pnl: 2036.18, pnlPercent: 17.11, xirr: 14.2, sipAmount: 5000, sipFrequency: 'Monthly', nextSipDate: '2025-06-05', rating: 4, expenseRatio: 0.52 },
  { id: 'mf2', fundName: 'Parag Parikh Flexi Cap Fund - Growth', fundCode: '122639', category: 'Flexi Cap', amc: 'PPFAS AMC', units: 312.45, averageNav: 62.30, currentNav: 78.40, invested: 19466, currentValue: 24496.08, pnl: 5030.08, pnlPercent: 25.84, xirr: 22.5, sipAmount: 10000, sipFrequency: 'Monthly', nextSipDate: '2025-06-10', rating: 5, expenseRatio: 0.63 },
  { id: 'mf3', fundName: 'HDFC Mid-Cap Opportunities Fund', fundCode: '100236', category: 'Mid Cap', amc: 'HDFC AMC', units: 180.67, averageNav: 115.40, currentNav: 142.60, invested: 20853, currentValue: 25763.54, pnl: 4910.54, pnlPercent: 23.55, xirr: 19.8, rating: 4, expenseRatio: 0.78 },
];

export const mockAlerts: Alert[] = [
  { id: 'a1', symbol: 'RELIANCE', companyName: 'Reliance Industries', type: 'PRICE_TARGET', condition: 'Price reaches ₹2,800', targetPrice: 2800, isActive: true, triggered: false, createdAt: '2025-01-15' },
  { id: 'a2', symbol: 'WIPRO', companyName: 'Wipro', type: 'PERCENTAGE_CHANGE', condition: 'Falls more than 5% in a day', percentageChange: -5, isActive: true, triggered: false, createdAt: '2025-02-01' },
  { id: 'a3', symbol: 'HDFCBANK', companyName: 'HDFC Bank', type: 'PRICE_TARGET', condition: 'Price reaches ₹1,800', targetPrice: 1800, isActive: true, triggered: false, createdAt: '2025-01-20' },
  { id: 'a4', symbol: 'TCS', companyName: 'TCS', type: '52W_HIGH', condition: 'Reaches 52-week high', isActive: true, triggered: true, triggeredAt: '2025-05-10', createdAt: '2024-12-01' },
];

export function generatePortfolioChartData(period: string, baseValue: number = 320000) {
  const points: { date: string; value: number; benchmark: number }[] = [];
  let days = 30;
  if (period === '1D') days = 1;
  else if (period === '1W') days = 7;
  else if (period === '1M') days = 30;
  else if (period === '3M') days = 90;
  else if (period === '6M') days = 180;
  else if (period === '1Y') days = 365;
  else if (period === '3Y') days = 1095;
  else if (period === '5Y') days = 1825;
  else days = 2500;

  let value = baseValue * 0.85; // Start a bit lower
  if (baseValue === 0) value = 10000;
  let bench = value;
  const step = days <= 7 ? 1 : days <= 90 ? 1 : Math.floor(days / 200);

  for (let i = 0; i < Math.min(days, 250); i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i * step));
    value += (Math.random() - 0.45) * value * 0.012;
    bench += (Math.random() - 0.47) * bench * 0.01;
    points.push({
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      value: Math.round(value),
      benchmark: Math.round(bench),
    });
  }
  
  // Adjust the entire curve so the final point exactly matches baseValue
  if (points.length > 0 && baseValue > 0) {
    const finalVal = points[points.length - 1].value;
    const ratio = baseValue / finalVal;
    points.forEach(p => {
      p.value = Math.round(p.value * ratio);
      p.benchmark = Math.round(p.benchmark * ratio);
    });
  }

  return points;
}

export const portfolioStats = {
  totalValue: 526173.53,
  totalInvested: 485750,
  totalPnl: 40423.53,
  totalPnlPercent: 8.32,
  dayPnl: 3245.80,
  dayPnlPercent: 0.62,
  xirr: 15.8,
  bestPerformer: { symbol: 'ICICIBANK', change: 26.42 },
  worstPerformer: { symbol: 'ASIANPAINT', change: -15.35 },
};
