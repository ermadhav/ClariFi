'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Award, Plus, RefreshCw, FileText, Bell, ArrowUpRight, ArrowDownRight, Star, Bookmark, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { formatCurrency, formatPercent, getChangeColor, timeAgo } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TimePeriod } from '@/types';

const periods: TimePeriod[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'ALL'];

const SECTOR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];

function AnimatedValue({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = value;
    const duration = 600;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{prefix}{formatCurrency(displayed)}</span>;
}

export default function DashboardPage() {
  const { chartPeriod, setChartPeriod, setActivePage } = useAppStore();
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('pnlPercent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [holdings, setHoldings] = useState<any[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Initial load from DB (fast)
  useEffect(() => {
    async function fetchInitial() {
      try {
        const [holdingsRes, statsRes] = await Promise.all([
          fetch('/api/holdings'),
          fetch('/api/portfolio/stats')
        ]);
        if (holdingsRes.ok && statsRes.ok) {
          const hData = await holdingsRes.json();
          const sData = await statsRes.json();
          setHoldings(hData.holdings || []);
          setPortfolioStats(sData.stats || null);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchInitial();
  }, []);

  // Live price polling - every 15 seconds
  const fetchLivePrices = useCallback(async () => {
    try {
      const res = await fetch('/api/holdings/live');
      if (res.ok) {
        const data = await res.json();
        if (data.holdings) setHoldings(data.holdings);
        if (data.stats) setPortfolioStats(data.stats);
        setIsLive(true);
        setLastUpdate(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      setIsLive(false);
      console.error('Live fetch error:', err);
    }
  }, []);

  useEffect(() => {
    // Fetch live immediately after initial load
    const timer = setTimeout(fetchLivePrices, 1000);
    // Then every 15 seconds
    const interval = setInterval(fetchLivePrices, 15_000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [fetchLivePrices]);

  // Real portfolio chart data
  useEffect(() => {
    async function fetchChart() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/portfolio/chart?period=${chartPeriod}`);
        if (res.ok) {
          const data = await res.json();
          setChartData(data.chartData || []);
        }
      } catch (err) { console.error('Chart fetch error:', err); }
      finally { setChartLoading(false); }
    }
    fetchChart();
  }, [chartPeriod]);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>;
  }

  const sorted = [...holdings].sort((a, b) => {
    const aVal = a[sortBy as keyof typeof a] as number;
    const bVal = b[sortBy as keyof typeof b] as number;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const sectorData = Object.entries(
    holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.sector || 'Uncategorized'] = (acc[h.sector || 'Uncategorized'] || 0) + (h.currentValue || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value) }));

  const totalValue = portfolioStats?.totalValue || 0;

  const stats = portfolioStats ? [
    { label: 'Total Portfolio Value', value: portfolioStats.totalValue, icon: Wallet, color: 'from-indigo-500/20 to-purple-500/10', iconColor: 'text-indigo-400' },
    { label: "Today's P&L", value: portfolioStats.dayPnl, percent: portfolioStats.dayPnlPercent, icon: portfolioStats.dayPnl >= 0 ? TrendingUp : TrendingDown, color: portfolioStats.dayPnl >= 0 ? 'from-emerald-500/20 to-green-500/10' : 'from-red-500/20 to-rose-500/10', iconColor: portfolioStats.dayPnl >= 0 ? 'text-profit' : 'text-loss' },
    { label: 'Total Returns', value: portfolioStats.totalPnl, percent: portfolioStats.totalPnlPercent, icon: BarChart3, color: 'from-violet-500/20 to-indigo-500/10', iconColor: 'text-violet-400', extra: `XIRR: ${portfolioStats.xirr ? portfolioStats.xirr.toFixed(2) : 0}%` },
    { label: 'Best Performer', value: null, icon: Award, color: 'from-amber-500/20 to-yellow-500/10', iconColor: 'text-amber-400', stock: portfolioStats.bestPerformer },
  ] : [];

  return (
    <div className="space-y-6 animate-in">
      {/* Live Status Indicator */}
      <div className="flex items-center justify-end gap-2 text-xs">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
            Live · {lastUpdate}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <WifiOff className="w-3 h-3" /> Connecting...
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`stat-card bg-gradient-to-br ${s.color}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
            </div>
            {s.value !== null ? (
              <>
                <div className="text-2xl font-bold text-foreground">
                  <AnimatedValue value={s.value} />
                </div>
                {s.percent !== undefined && (
                  <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${s.value >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {s.value >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {formatPercent(s.percent)}
                  </div>
                )}
                {s.extra && <div className="text-xs text-muted-foreground mt-1">{s.extra}</div>}
              </>
            ) : s.stock ? (
              <>
                <div className="text-xl font-bold text-foreground">{s.stock.symbol}</div>
                <div className="flex items-center gap-1 mt-1 text-sm font-medium text-profit">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {formatPercent(s.stock.change ?? s.stock.pnlPercent)}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground mt-2">No positive returns yet.</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Portfolio Performance</h2>
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {periods.map((p) => (
                <button key={p} onClick={() => setChartPeriod(p)} className={`tab-button text-xs px-2.5 py-1 ${chartPeriod === p ? 'active' : ''}`}>{p}</button>
              ))}
            </div>
          </div>
          {chartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-6 h-6 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#e4e4e7' }} itemStyle={{ color: '#e4e4e7' }} formatter={(v: number) => [formatCurrency(v), '']} />
                <Area type="monotone" dataKey="benchmark" stroke="#a78bfa" strokeWidth={1.5} fill="url(#colorBench)" strokeDasharray="4 4" name="Nifty 50" />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#colorValue)" name="Portfolio" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 rounded" /> Your Portfolio</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-400 rounded border-dashed" /> Nifty 50</span>
          </div>
        </motion.div>

        {/* Sector Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Sector Allocation</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sectorData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                {sectorData.map((_, i) => (
                  <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#e4e4e7' }} itemStyle={{ color: '#e4e4e7' }} formatter={(v: number) => [formatCurrency(v), '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {sectorData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="text-foreground font-medium">{totalValue > 0 ? ((s.value / totalValue) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Holdings Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-sm font-semibold text-foreground">Holdings ({holdings.length})</h2>
          <div className="flex items-center gap-2">
            <button className="btn-primary text-xs py-1.5 px-3"><Plus className="w-3.5 h-3.5" /> Add Stock</button>
            <button onClick={fetchLivePrices} className="btn-secondary text-xs py-1.5 px-3"><RefreshCw className="w-3.5 h-3.5" /> Sync</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border text-xs text-muted-foreground uppercase tracking-wider">
                {[
                  { key: 'companyName', label: 'Stock' },
                  { key: 'quantity', label: 'Qty' },
                  { key: 'averagePrice', label: 'Avg Price' },
                  { key: 'currentPrice', label: 'LTP' },
                  { key: 'currentValue', label: 'Value' },
                  { key: 'pnl', label: 'P&L' },
                  { key: 'pnlPercent', label: 'P&L %' },
                  { key: 'dayChangePercent', label: 'Day %' },
                ].map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left cursor-pointer hover:text-foreground transition-colors" onClick={() => { setSortBy(col.key); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}>
                    {col.label} {sortBy === col.key && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.id} className="border-t border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setActivePage('stock-' + (h.symbol || h.stockSymbol?.split(':')[1] || ''))}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {(h.symbol || h.stockSymbol?.split(':')[1] || 'UN').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{h.companyName}</div>
                        <div className="text-xs text-muted-foreground">{h.exchange}:{h.symbol || h.stockSymbol?.split(':')[1] || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{h.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrency(h.averagePrice)}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{formatCurrency(h.currentPrice)}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(h.currentValue)}</td>
                  <td className={`px-4 py-3 font-medium ${(h.pnl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>{formatCurrency(h.pnl)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${(h.pnlPercent || 0) >= 0 ? 'badge-profit' : 'badge-loss'}`}>{formatPercent(h.pnlPercent)}</span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${(h.dayChangePercent || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {h.dayChangePercent !== undefined && h.dayChangePercent !== 0 ? formatPercent(h.dayChangePercent) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add Stock', icon: Plus, color: 'from-indigo-500/10 to-indigo-500/5' },
              { label: 'Set Alert', icon: Bell, color: 'from-amber-500/10 to-amber-500/5', onClick: () => setActivePage('alerts') },
              { label: 'Tax Report', icon: FileText, color: 'from-emerald-500/10 to-emerald-500/5', onClick: () => setActivePage('tax') },
              { label: 'Sync Now', icon: RefreshCw, color: 'from-cyan-500/10 to-cyan-500/5', onClick: fetchLivePrices },
            ].map((a) => (
              <button key={a.label} onClick={a.onClick} className={`flex items-center gap-2.5 p-3 rounded-lg bg-gradient-to-r ${a.color} border border-white/5 hover:border-white/10 transition-all text-sm text-foreground`}>
                <a.icon className="w-4 h-4 text-muted-foreground" />
                {a.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Market Info</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ClariFi is for informational purposes only and does not constitute investment advice. Past performance does not guarantee future results. Consult a SEBI-registered financial advisor before making investment decisions. Data sourced from NSE/BSE and may be delayed.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
