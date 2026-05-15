'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockIndices, mockSectors, mockHoldings } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, Globe, Activity, BarChart3, DollarSign, Flame } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const topGainers = [...mockHoldings].sort((a, b) => b.dayChangePercent - a.dayChangePercent).slice(0, 5);
const topLosers = [...mockHoldings].sort((a, b) => a.dayChangePercent - b.dayChangePercent).slice(0, 5);

const globalIndices = [
  { name: 'Dow Jones', value: 42580.50, change: 0.45 },
  { name: 'S&P 500', value: 5892.30, change: 0.62 },
  { name: 'NASDAQ', value: 19245.80, change: 0.89 },
  { name: 'FTSE 100', value: 8456.20, change: -0.23 },
  { name: 'Nikkei 225', value: 38920.40, change: 1.12 },
  { name: 'Hang Seng', value: 19845.60, change: -0.78 },
];

const commodities = [
  { name: 'Gold', price: '₹72,450/10g', change: 0.35 },
  { name: 'Silver', price: '₹86,200/kg', change: -0.42 },
  { name: 'Crude Oil', price: '$78.50/bbl', change: 1.15 },
];

const currencies = [
  { pair: 'USD/INR', value: 83.42, change: -0.08 },
  { pair: 'EUR/INR', value: 90.85, change: 0.12 },
  { pair: 'GBP/INR', value: 106.20, change: -0.15 },
];

export default function MarketPage() {
  const [moverTab, setMoverTab] = useState<'gainers' | 'losers'>('gainers');

  return (
    <div className="space-y-6 animate-in">
      {/* Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {mockIndices.map((idx, i) => (
          <motion.div key={idx.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{idx.name}</div>
            <div className="text-lg font-bold text-foreground">{idx.value.toLocaleString('en-IN')}</div>
            <div className={`flex items-center gap-1 text-sm font-medium ${idx.change >= 0 ? 'text-profit' : 'text-loss'}`}>
              {idx.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({formatPercent(idx.changePercent)})
            </div>
            <div className="mt-2">
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={idx.sparkline.map((v, j) => ({ v, i: j }))}>
                  <defs><linearGradient id={`idx${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={idx.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} /><stop offset="100%" stopColor={idx.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke={idx.change >= 0 ? '#22c55e' : '#ef4444'} strokeWidth={1.5} fill={`url(#idx${i})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sector Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2 glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-amber-400" /> Sector Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {mockSectors.map((s) => (
              <div key={s.name} className={`p-3 rounded-lg border transition-all cursor-pointer hover:scale-105 ${s.change >= 0 ? 'bg-profit/5 border-profit/20 hover:border-profit/40' : 'bg-loss/5 border-loss/20 hover:border-loss/40'}`}>
                <div className="text-xs font-medium text-foreground">{s.name}</div>
                <div className={`text-lg font-bold ${s.change >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(s.change)}</div>
                <div className="text-[10px] text-muted-foreground">{s.stocks} stocks</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Market Movers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 mb-4">
            <button onClick={() => setMoverTab('gainers')} className={`tab-button flex-1 ${moverTab === 'gainers' ? 'active' : ''}`}>🟢 Gainers</button>
            <button onClick={() => setMoverTab('losers')} className={`tab-button flex-1 ${moverTab === 'losers' ? 'active' : ''}`}>🔴 Losers</button>
          </div>
          <div className="space-y-2">
            {(moverTab === 'gainers' ? topGainers : topLosers).map((s, i) => (
              <div key={s.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{s.sector}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-foreground">{formatCurrency(s.currentPrice)}</div>
                  <div className={`text-xs font-medium ${s.dayChangePercent >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(s.dayChangePercent)}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Global + Commodities + Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Global Indices</h2>
          <div className="space-y-2">
            {globalIndices.map((g) => (
              <div key={g.name} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">{g.name}</span>
                <div className="text-right">
                  <span className="text-xs text-foreground font-medium">{g.value.toLocaleString()}</span>
                  <span className={`text-xs ml-2 ${g.change >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(g.change)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Commodities</h2>
          <div className="space-y-3">
            {commodities.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">{c.name}</span>
                <div className="text-right">
                  <span className="text-xs text-foreground font-medium">{c.price}</span>
                  <span className={`text-xs ml-2 ${c.change >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(c.change)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Currency Rates</h2>
          <div className="space-y-3">
            {currencies.map((c) => (
              <div key={c.pair} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">{c.pair}</span>
                <div className="text-right">
                  <span className="text-xs text-foreground font-medium">₹{c.value}</span>
                  <span className={`text-xs ml-2 ${c.change >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(c.change)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
