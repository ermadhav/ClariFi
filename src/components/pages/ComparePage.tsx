'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockHoldings } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Plus, X, Trophy } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>(['RELIANCE', 'TCS', 'HDFCBANK']);
  const stocks = selected.map((s) => mockHoldings.find((h) => h.symbol === s)!).filter(Boolean);

  const metrics = [
    { key: 'pe', label: 'P/E Ratio', format: (v: number) => v.toFixed(1) },
    { key: 'pb', label: 'P/B Ratio', format: (v: number) => v.toFixed(1) },
    { key: 'dividendYield', label: 'Div Yield %', format: (v: number) => v.toFixed(1) + '%' },
    { key: 'beta', label: 'Beta', format: (v: number) => v.toFixed(2) },
    { key: 'pnlPercent', label: 'Return %', format: (v: number) => formatPercent(v) },
    { key: 'dayChangePercent', label: 'Day Change', format: (v: number) => formatPercent(v) },
  ];

  const radarData = [
    { metric: 'Value', ...Object.fromEntries(stocks.map((s) => [s.symbol, Math.max(0, 100 - s.pe * 2)])) },
    { metric: 'Growth', ...Object.fromEntries(stocks.map((s) => [s.symbol, Math.min(100, s.pnlPercent * 3 + 50)])) },
    { metric: 'Stability', ...Object.fromEntries(stocks.map((s) => [s.symbol, Math.max(0, 100 - s.beta * 40)])) },
    { metric: 'Dividend', ...Object.fromEntries(stocks.map((s) => [s.symbol, s.dividendYield * 30])) },
    { metric: 'Momentum', ...Object.fromEntries(stocks.map((s) => [s.symbol, Math.min(100, s.dayChangePercent * 20 + 50)])) },
  ];

  const available = mockHoldings.filter((h) => !selected.includes(h.symbol));

  return (
    <div className="space-y-6 animate-in">
      {/* Selected stocks */}
      <div className="flex items-center gap-2 flex-wrap">
        {stocks.map((s, i) => (
          <div key={s.symbol} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-white/5" style={{ borderColor: COLORS[i] + '40' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
            <span className="text-sm font-medium text-foreground">{s.symbol}</span>
            <button onClick={() => setSelected(selected.filter((x) => x !== s.symbol))}><X className="w-3 h-3 text-muted-foreground" /></button>
          </div>
        ))}
        {selected.length < 4 && (
          <select onChange={(e) => { if (e.target.value) { setSelected([...selected, e.target.value]); e.target.value = ''; } }} className="input-field text-xs w-40 py-1.5">
            <option value="">+ Add stock</option>
            {available.map((h) => <option key={h.symbol} value={h.symbol}>{h.symbol}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Overall Profile</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              {stocks.map((s, i) => (
                <Radar key={s.symbol} name={s.symbol} dataKey={s.symbol} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="px-4 py-3 text-left">Metric</th>
                  {stocks.map((s, i) => (
                    <th key={s.symbol} className="px-4 py-3 text-right"><span style={{ color: COLORS[i] }}>{s.symbol}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-muted-foreground">Price</td>
                  {stocks.map((s) => <td key={s.symbol} className="px-4 py-3 text-right text-foreground font-medium">{formatCurrency(s.currentPrice)}</td>)}
                </tr>
                {metrics.map((m) => {
                  const values = stocks.map((s) => (s as Record<string, number>)[m.key]);
                  const best = m.key === 'pe' || m.key === 'beta' ? Math.min(...values) : Math.max(...values);
                  return (
                    <tr key={m.key} className="border-b border-border/50">
                      <td className="px-4 py-3 text-muted-foreground">{m.label}</td>
                      {stocks.map((s, i) => {
                        const val = (s as Record<string, number>)[m.key];
                        const isBest = val === best;
                        return (
                          <td key={s.symbol} className={`px-4 py-3 text-right font-medium ${isBest ? 'text-profit' : 'text-foreground'}`}>
                            {m.format(val)} {isBest && <Trophy className="w-3 h-3 inline ml-1 text-amber-400" />}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-muted-foreground">Sector</td>
                  {stocks.map((s) => <td key={s.symbol} className="px-4 py-3 text-right"><span className="badge badge-info">{s.sector}</span></td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
