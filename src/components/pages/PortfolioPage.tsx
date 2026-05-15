'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockHoldings, portfolioStats } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Treemap, PieChart, Pie, Cell } from 'recharts';
import { Grid3x3, PieChart as PieIcon, BarChart3, AlertTriangle, Shield, Target } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];
type ViewMode = 'sector' | 'marketCap' | 'industry';
type ChartType = 'donut' | 'treemap' | 'bar';

export default function PortfolioPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('sector');
  const [chartType, setChartType] = useState<ChartType>('donut');

  const groupBy = (key: ViewMode) => {
    const groups: Record<string, { name: string; value: number; pnl: number; count: number }> = {};
    mockHoldings.forEach((h) => {
      const k = key === 'marketCap' ? h.marketCap.replace('_', ' ') : h[key];
      if (!groups[k]) groups[k] = { name: k, value: 0, pnl: 0, count: 0 };
      groups[k].value += h.currentValue;
      groups[k].pnl += h.pnl;
      groups[k].count++;
    });
    return Object.values(groups).sort((a, b) => b.value - a.value);
  };

  const data = groupBy(viewMode);
  const totalValue = data.reduce((s, d) => s + d.value, 0);

  const concentrationRisk = Math.max(...mockHoldings.map((h) => (h.currentValue / portfolioStats.totalValue) * 100));
  const sectorCount = new Set(mockHoldings.map((h) => h.sector)).size;
  const diversificationScore = Math.min(100, sectorCount * 12 + (concentrationRisk < 20 ? 20 : 0));

  return (
    <div className="space-y-6 animate-in">
      {/* View Mode + Chart Type */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {([['sector', 'By Sector'], ['marketCap', 'By Market Cap'], ['industry', 'By Industry']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)} className={`tab-button ${viewMode === v ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {([['donut', PieIcon], ['treemap', Grid3x3], ['bar', BarChart3]] as const).map(([t, Icon]) => (
            <button key={t} onClick={() => setChartType(t as ChartType)} className={`tab-button flex items-center gap-1.5 ${chartType === t ? 'active' : ''}`}>
              <Icon className="w-3.5 h-3.5" />{t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="xl:col-span-2 glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Allocation ({viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})</h2>
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'donut' ? (
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={3} dataKey="value" stroke="none" label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [formatCurrency(v), 'Value']} />
              </PieChart>
            ) : chartType === 'bar' ? (
              <BarChart data={data} layout="vertical">
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => formatCurrency(v, true)} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [formatCurrency(v), 'Value']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            ) : (
              <Treemap data={data} dataKey="value" nameKey="name" stroke="#18181b" fill="#6366f1">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Treemap>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Analytics */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-400" /> Portfolio Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Diversification</span><span className="text-foreground font-medium">{diversificationScore}/100</span></div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${diversificationScore}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Concentration Risk</span><span className={`font-medium ${concentrationRisk > 25 ? 'text-warning' : 'text-profit'}`}>{concentrationRisk.toFixed(1)}%</span></div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${concentrationRisk}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Sectors Covered</span><span className="text-foreground font-medium">{sectorCount}</span></div>
              </div>
            </div>
          </motion.div>

          {concentrationRisk > 18 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-amber-400">Concentration Alert</h4>
                  <p className="text-xs text-amber-400/70 mt-1">
                    Your largest holding ({mockHoldings.sort((a, b) => b.currentValue - a.currentValue)[0].symbol}) accounts for {concentrationRisk.toFixed(1)}% of your portfolio. Consider diversifying.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Breakdown Details</h3>
            <div className="space-y-2">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                    <span className="text-[10px] text-muted-foreground/50">({d.count})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-foreground font-medium">{((d.value / totalValue) * 100).toFixed(1)}%</div>
                    <div className={`text-[10px] ${d.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent((d.pnl / (d.value - d.pnl)) * 100)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
