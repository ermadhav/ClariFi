'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockIndices, mockSectors, mockHoldings } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, Globe, Activity, BarChart3, DollarSign, Flame } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function MarketPage() {
  const [moverTab, setMoverTab] = useState<'gainers' | 'losers'>('gainers');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/market/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch market overview', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const indices = data?.indices || [];
  const sectors = data?.sectors || [];
  const globalIndices = data?.globalIndices || [];
  const commodities = data?.commodities || [];
  const currencies = data?.currencies || [];
  const topGainers = data?.topGainers || [];
  const topLosers = data?.topLosers || [];

  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {indices.map((idx: any, i: number) => (
          <motion.div key={idx.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{idx.name}</div>
            <div className="text-lg font-bold text-foreground">{idx.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div className={`flex items-center gap-1 text-sm font-medium ${idx.change >= 0 ? 'text-profit' : 'text-loss'}`}>
              {idx.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({formatPercent(idx.changePercent)})
            </div>
            <div className="mt-2">
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={idx.sparkline?.map((v: any, j: number) => ({ v, i: j })) || []}>
                  <defs><linearGradient id={`idx${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={idx.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} /><stop offset="100%" stopColor={idx.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke={idx.change >= 0 ? '#22c55e' : '#ef4444'} strokeWidth={1.5} fill={`url(#idx${i})`} isAnimationActive={false} />
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
            {sectors.map((s: any) => (
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
            {globalIndices.map((g: any) => (
              <div key={g.name} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-muted-foreground">{g.name}</span>
                <div className="text-right">
                  <span className="text-xs text-foreground font-medium">{g.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                  <span className={`text-xs ml-2 ${g.changePercent >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(g.changePercent)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Commodities</h2>
          <div className="space-y-2">
            {commodities.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
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
          <div className="space-y-2">
            {currencies.map((c: any) => (
              <div key={c.pair} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-muted-foreground">{c.pair}</span>
                <div className="text-right">
                  <span className="text-xs text-foreground font-medium">₹{c.value.toFixed(2)}</span>
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
