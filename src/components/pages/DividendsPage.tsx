'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Calendar, Download, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DividendEntry {
  id: string; symbol: string; companyName: string; exDate: string;
  dividendPerShare: number; quantityHeld: number;
  totalDividend: number; tdsDeducted: number; netAmount: number;
}

export default function DividendsPage() {
  const [dividends, setDividends] = useState<DividendEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, tds: 0, net: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '1y' | '3y'>('all');

  useEffect(() => {
    async function fetchDividends() {
      try {
        const res = await fetch('/api/dividends');
        if (res.ok) {
          const data = await res.json();
          setDividends(data.dividends || []);
          setStats(data.stats || { total: 0, tds: 0, net: 0, count: 0 });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchDividends();
  }, []);

  // Filter dividends by time
  const filtered = dividends.filter(d => {
    if (filter === 'all') return true;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - (filter === '1y' ? 1 : 3));
    return new Date(d.exDate) >= cutoff;
  });

  // Recalculate stats for filtered view
  const filteredTotal = filtered.reduce((s, d) => s + d.totalDividend, 0);
  const filteredTDS = filtered.reduce((s, d) => s + d.tdsDeducted, 0);
  const filteredNet = filtered.reduce((s, d) => s + d.netAmount, 0);
  const filteredStocks = new Set(filtered.map(d => d.symbol)).size;

  // Chart data: group by stock
  const stockMap: Record<string, { symbol: string; amount: number; tds: number }> = {};
  filtered.forEach(d => {
    if (!stockMap[d.symbol]) stockMap[d.symbol] = { symbol: d.symbol, amount: 0, tds: 0 };
    stockMap[d.symbol].amount += d.totalDividend;
    stockMap[d.symbol].tds += d.tdsDeducted;
  });
  const chartData = Object.values(stockMap).sort((a, b) => b.amount - a.amount);

  // Yearly breakdown chart
  const yearMap: Record<string, number> = {};
  filtered.forEach(d => {
    const year = new Date(d.exDate).getFullYear().toString();
    yearMap[year] = (yearMap[year] || 0) + d.totalDividend;
  });
  const yearData = Object.entries(yearMap)
    .map(([year, amount]) => ({ year, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.year.localeCompare(b.year));

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', '1y', '3y'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`tab-button ${filter === f ? 'active' : ''}`}>
            {f === 'all' ? 'All Time' : f === '1y' ? 'Last 1 Year' : 'Last 3 Years'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Dividends', value: formatCurrency(filteredTotal), icon: DollarSign, color: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'TDS Deducted', value: formatCurrency(filteredTDS), icon: Calendar, color: 'from-red-500/20 to-red-500/5' },
          { label: 'Net Received', value: formatCurrency(filteredNet), icon: TrendingUp, color: 'from-indigo-500/20 to-indigo-500/5' },
          { label: 'Dividend Stocks', value: filteredStocks.toString(), icon: DollarSign, color: 'from-amber-500/20 to-amber-500/5' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center justify-between">
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div><div className="text-xl font-bold text-foreground">{s.value}</div></div>
              <s.icon className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Dividend by Stock Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Dividend by Stock</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => `₹${v}`} />
                <YAxis type="category" dataKey="symbol" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [formatCurrency(v), '']} />
                <Bar dataKey="amount" name="Dividend" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              No dividend data available for your holdings.
            </div>
          )}
        </motion.div>

        {/* Dividend History Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="xl:col-span-2 glass-card overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Dividend History {filtered.length > 0 && <span className="text-muted-foreground font-normal">({filtered.length} entries)</span>}
            </h2>
            <button className="btn-secondary text-xs py-1.5"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p>No dividends found for your holdings in this period.</p>
              <p className="text-xs mt-1">Dividend data is sourced from Yahoo Finance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-y border-border">
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Ex-Date</th>
                    <th className="px-4 py-3 text-right">Per Share</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">TDS</th>
                    <th className="px-4 py-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-foreground">{d.symbol}<div className="text-xs text-muted-foreground">{d.companyName}</div></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(d.exDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-right text-foreground">₹{d.dividendPerShare.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{d.quantityHeld}</td>
                      <td className="px-4 py-3 text-right text-profit font-medium">{formatCurrency(d.totalDividend)}</td>
                      <td className="px-4 py-3 text-right text-loss">{formatCurrency(d.tdsDeducted)}</td>
                      <td className="px-4 py-3 text-right text-foreground font-medium">{formatCurrency(d.netAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Yearly Breakdown */}
      {yearData.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Yearly Dividend Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [formatCurrency(v), '']} />
              <Bar dataKey="amount" name="Dividend" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
