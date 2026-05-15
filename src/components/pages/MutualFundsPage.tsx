'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockMutualFunds } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Plus, Star, PieChart, TrendingUp, Calendar, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

export default function MutualFundsPage() {
  const [tab, setTab] = useState<'holdings' | 'sip' | 'calculator'>('holdings');
  const totalInvested = mockMutualFunds.reduce((s, f) => s + f.invested, 0);
  const totalValue = mockMutualFunds.reduce((s, f) => s + f.currentValue, 0);
  const totalPnl = totalValue - totalInvested;

  const sipData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    invested: (i + 1) * 15000,
    value: (i + 1) * 15000 * (1 + Math.random() * 0.15),
  }));

  return (
    <div className="space-y-6 animate-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested', value: formatCurrency(totalInvested), color: 'from-indigo-500/20 to-indigo-500/5' },
          { label: 'Current Value', value: formatCurrency(totalValue), color: 'from-purple-500/20 to-purple-500/5' },
          { label: 'Total Returns', value: formatCurrency(totalPnl), sub: formatPercent((totalPnl / totalInvested) * 100), color: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'Active SIPs', value: mockMutualFunds.filter((f) => f.sipAmount).length.toString(), sub: `₹${mockMutualFunds.filter((f) => f.sipAmount).reduce((s, f) => s + (f.sipAmount || 0), 0).toLocaleString('en-IN')}/mo`, color: 'from-amber-500/20 to-amber-500/5' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card bg-gradient-to-br ${s.color}`}>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            {s.sub && <div className="text-xs text-profit mt-1">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 w-fit">
        {([['holdings', 'Holdings'], ['sip', 'SIP Tracker'], ['calculator', 'SIP Calculator']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`tab-button ${tab === v ? 'active' : ''}`}>{l}</button>
        ))}
      </div>

      {tab === 'holdings' && (
        <div className="space-y-3">
          {mockMutualFunds.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground">{f.fundName}</h3>
                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`w-3 h-3 ${j < f.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />)}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="badge badge-info">{f.category}</span>
                    <span>{f.amc}</span>
                    <span>Expense: {f.expenseRatio}%</span>
                    {f.sipAmount && <span className="badge badge-profit">SIP ₹{f.sipAmount.toLocaleString('en-IN')}/mo</span>}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6 text-right">
                  <div><div className="text-[10px] text-muted-foreground">Invested</div><div className="text-sm font-medium text-foreground">{formatCurrency(f.invested)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Current</div><div className="text-sm font-medium text-foreground">{formatCurrency(f.currentValue)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Returns</div><div className={`text-sm font-medium ${f.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{formatCurrency(f.pnl)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">XIRR</div><div className="text-sm font-medium text-profit">{f.xirr}%</div></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'sip' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">SIP Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sipData}>
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="invested" name="Invested" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="value" name="Value" fill="#22c55e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {tab === 'calculator' && (
        <MFCalculator />
      )}
    </div>
  );
}

function MFCalculator() {
  const [sip, setSip] = useState(10000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const months = years * 12;
  const monthlyRate = rate / 100 / 12;
  const futureValue = sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const totalInvested = sip * months;
  const returns = futureValue - totalInvested;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 max-w-xl">
      <h2 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-400" /> SIP Calculator</h2>
      <div className="space-y-5">
        <div><label className="text-xs text-muted-foreground mb-2 block">Monthly SIP: {formatCurrency(sip)}</label><input type="range" min="500" max="100000" step="500" value={sip} onChange={(e) => setSip(+e.target.value)} className="w-full accent-indigo-500" /></div>
        <div><label className="text-xs text-muted-foreground mb-2 block">Duration: {years} years</label><input type="range" min="1" max="30" value={years} onChange={(e) => setYears(+e.target.value)} className="w-full accent-indigo-500" /></div>
        <div><label className="text-xs text-muted-foreground mb-2 block">Expected Return: {rate}% p.a.</label><input type="range" min="1" max="30" value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-indigo-500" /></div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div><div className="text-xs text-muted-foreground">Invested</div><div className="text-lg font-bold text-foreground">{formatCurrency(totalInvested, true)}</div></div>
          <div><div className="text-xs text-muted-foreground">Returns</div><div className="text-lg font-bold text-profit">{formatCurrency(returns, true)}</div></div>
          <div><div className="text-xs text-muted-foreground">Total Value</div><div className="text-lg font-bold gradient-text">{formatCurrency(futureValue, true)}</div></div>
        </div>
      </div>
    </motion.div>
  );
}
