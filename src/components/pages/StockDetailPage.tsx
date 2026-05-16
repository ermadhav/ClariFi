'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockHoldings, mockTransactions } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Star, Bell, Share2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Bot, ChevronDown, Plus, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const quarterlyData = [
  { q: 'Q1 FY24', revenue: 92500, profit: 15200, yoyGrowth: 12 },
  { q: 'Q2 FY24', revenue: 96800, profit: 16400, yoyGrowth: 14 },
  { q: 'Q3 FY24', revenue: 98200, profit: 15800, yoyGrowth: 8 },
  { q: 'Q4 FY24', revenue: 105400, profit: 18200, yoyGrowth: 18 },
  { q: 'Q1 FY25', revenue: 108600, profit: 19100, yoyGrowth: 17 },
  { q: 'Q2 FY25', revenue: 112300, profit: 20500, yoyGrowth: 25 },
  { q: 'Q3 FY25', revenue: 115800, profit: 21200, yoyGrowth: 34 },
  { q: 'Q4 FY25', revenue: 121500, profit: 22800, yoyGrowth: 25 },
];

function generatePriceHistory(currentPrice: number) {
  const data = [];
  let price = currentPrice * 0.85;
  for (let i = 0; i < 100; i++) {
    price += (Math.random() - 0.47) * price * 0.015;
    const d = new Date();
    d.setDate(d.getDate() - (100 - i));
    data.push({ date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), price: Math.round(price * 100) / 100, volume: Math.round(Math.random() * 15000000) });
  }
  return data;
}

export default function StockDetailPage({ symbol }: { symbol: string }) {
  const { setActivePage } = useAppStore();
  const stock = mockHoldings.find((h) => h.symbol === symbol);
  const [period, setPeriod] = useState('1Y');
  const [showInsights, setShowInsights] = useState(true);

  if (!stock) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Stock not found</p>
      <button onClick={() => setActivePage('dashboard')} className="btn-primary text-xs mt-4">Go to Dashboard</button>
    </div>
  );

  const priceData = generatePriceHistory(stock.currentPrice);
  const stockTxns = mockTransactions.filter((t) => t.symbol === symbol);
  const holdingDays = Math.floor((new Date().getTime() - new Date(stock.firstBoughtDate).getTime()) / 86400000);

  const fundamentals = {
    roe: (12 + Math.random() * 20).toFixed(1),
    roce: (14 + Math.random() * 18).toFixed(1),
    debtToEquity: (Math.random() * 1.5).toFixed(2),
    currentRatio: (1 + Math.random() * 2).toFixed(2),
    promoterHolding: (45 + Math.random() * 25).toFixed(1),
    fiiHolding: (15 + Math.random() * 20).toFixed(1),
    diiHolding: (10 + Math.random() * 15).toFixed(1),
    bookValue: (stock.currentPrice * (0.3 + Math.random() * 0.4)).toFixed(0),
    eps: (stock.currentPrice / stock.pe).toFixed(2),
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Back + Hero */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActivePage('dashboard')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">{symbol.substring(0, 2)}</div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{stock.companyName}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="badge badge-info">{stock.exchange}</span>
                <span>{symbol}</span>
                <span>·</span>
                <span>{stock.sector}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs py-1.5"><Star className="w-3.5 h-3.5" /> Watchlist</button>
          <button className="btn-secondary text-xs py-1.5"><Bell className="w-3.5 h-3.5" /> Alert</button>
          <button className="btn-secondary text-xs py-1.5"><Share2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Price */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-4">
        <span className="text-4xl font-bold text-foreground">{formatCurrency(stock.currentPrice)}</span>
        <div className={`flex items-center gap-1 text-lg font-semibold ${stock.dayChange >= 0 ? 'text-profit' : 'text-loss'}`}>
          {stock.dayChange >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          {formatCurrency(Math.abs(stock.dayChange))} ({formatPercent(stock.dayChangePercent)})
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Price Chart</h2>
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            {['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`tab-button text-xs px-2.5 py-1 ${period === p ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stock.dayChange >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={stock.dayChange >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => `₹${v}`} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`₹${v}`, 'Price']} />
            <Area type="monotone" dataKey="price" stroke={stock.dayChange >= 0 ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#stockGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Fundamentals */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Key Metrics</h2>
          <div className="space-y-2.5">
            {[
              ['Market Cap', stock.marketCap.replace('_', ' ')],
              ['P/E Ratio', stock.pe.toFixed(1)],
              ['P/B Ratio', stock.pb.toFixed(1)],
              ['EPS', `₹${fundamentals.eps}`],
              ['Book Value', `₹${fundamentals.bookValue}`],
              ['Dividend Yield', `${stock.dividendYield}%`],
              ['Beta', stock.beta.toFixed(2)],
              ['ROE', `${fundamentals.roe}%`],
              ['ROCE', `${fundamentals.roce}%`],
              ['Debt/Equity', fundamentals.debtToEquity],
              ['52W High', formatCurrency(stock.high52w)],
              ['52W Low', formatCurrency(stock.low52w)],
              ['Volume', stock.volume.toLocaleString('en-IN')],
              ['Promoter %', `${fundamentals.promoterHolding}%`],
              ['FII %', `${fundamentals.fiiHolding}%`],
              ['DII %', `${fundamentals.diiHolding}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Your Holdings */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Your Holdings</h2>
          <div className="space-y-2.5">
            {[
              ['Quantity', stock.quantity.toString()],
              ['Avg Buy Price', formatCurrency(stock.averagePrice)],
              ['Total Invested', formatCurrency(stock.totalInvested)],
              ['Current Value', formatCurrency(stock.currentValue)],
              ['Unrealized P&L', formatCurrency(stock.pnl)],
              ['P&L %', formatPercent(stock.pnlPercent)],
              ['Day Gain/Loss', formatCurrency(stock.dayChange * stock.quantity)],
              ['Holding Period', `${holdingDays} days`],
              ['Portfolio Weight', `${stock.weight}%`],
              ['First Bought', new Date(stock.firstBoughtDate).toLocaleDateString('en-IN')],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs font-medium ${(label === 'Unrealized P&L' || label === 'P&L %') ? (stock.pnl >= 0 ? 'text-profit' : 'text-loss') : 'text-foreground'}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary text-xs flex-1"><Plus className="w-3 h-3" /> Buy More</button>
            <button className="btn-secondary text-xs flex-1"><Minus className="w-3 h-3" /> Sell</button>
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI Insights</h2>
              <span className="text-[10px] text-muted-foreground">Powered by GPT-4</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-indigo-400 mb-1.5">What This Means for You</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stock.companyName} has a P/E ratio of {stock.pe.toFixed(1)}, which is {stock.pe < 20 ? 'below' : stock.pe < 35 ? 'near' : 'above'} the sector average. This suggests the stock is {stock.pe < 20 ? 'potentially undervalued' : stock.pe < 35 ? 'fairly valued' : 'trading at a premium'} relative to its earnings.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-emerald-400 mb-1.5">✅ Strengths</h3>
              <ul className="space-y-1">
                <li className="text-xs text-muted-foreground">• Strong market position in {stock.sector} sector</li>
                <li className="text-xs text-muted-foreground">• ROE of {fundamentals.roe}% indicates efficient use of equity</li>
                <li className="text-xs text-muted-foreground">• {parseFloat(fundamentals.promoterHolding) > 50 ? 'High' : 'Moderate'} promoter holding at {fundamentals.promoterHolding}%</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-amber-400 mb-1.5">⚠️ Watch Out</h3>
              <ul className="space-y-1">
                <li className="text-xs text-muted-foreground">• Beta of {stock.beta.toFixed(2)} means {stock.beta > 1 ? 'higher than market' : 'lower than market'} volatility</li>
                <li className="text-xs text-muted-foreground">• Current price is {((stock.high52w - stock.currentPrice) / stock.high52w * 100).toFixed(0)}% below 52-week high</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sentiment:</span>
                <span className={`badge ${stock.pnlPercent > 5 ? 'badge-profit' : stock.pnlPercent < -5 ? 'badge-loss' : 'badge-neutral'}`}>
                  {stock.pnlPercent > 5 ? '🟢 Bullish' : stock.pnlPercent < -5 ? '🔴 Bearish' : '⚪ Neutral'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quarterly Results */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Quarterly Results</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={quarterlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="q" tick={{ fill: '#71717a', fontSize: 10 }} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K Cr`} />
            <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')} Cr`, '']} />
            <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="profit" name="Net Profit" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Transaction History */}
      {stockTxns.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
          <div className="p-5 pb-3"><h2 className="text-sm font-semibold text-foreground">Your Transactions</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider border-y border-border">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stockTxns.map((t) => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-center"><span className={`badge ${t.type === 'BUY' ? 'badge-profit' : 'badge-loss'}`}>{t.type}</span></td>
                    <td className="px-4 py-3 text-right text-foreground">{t.quantity}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(t.pricePerShare)}</td>
                    <td className="px-4 py-3 text-right text-foreground font-medium">{formatCurrency(t.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
