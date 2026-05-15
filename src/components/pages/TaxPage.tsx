'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockCapitalGains, mockHoldings } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Calculator, Download, Lightbulb, AlertTriangle, TrendingDown, ChevronDown, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TaxPage() {
  const [fy, setFy] = useState('FY 2024-25');
  const stcg = mockCapitalGains.filter((g) => g.type === 'STCG');
  const ltcg = mockCapitalGains.filter((g) => g.type === 'LTCG');
  const totalSTCG = stcg.reduce((s, g) => s + g.gain, 0);
  const totalLTCG = ltcg.reduce((s, g) => s + g.gain, 0);
  const stcgTax = totalSTCG * 0.20;
  const ltcgExemption = 125000;
  const ltcgTaxable = Math.max(0, totalLTCG - ltcgExemption);
  const ltcgTax = ltcgTaxable * 0.125;
  const totalTax = stcgTax + ltcgTax;

  const lossMakers = mockHoldings.filter((h) => h.pnl < 0).sort((a, b) => a.pnl - b.pnl);
  const potentialSavings = lossMakers.reduce((s, h) => s + Math.abs(h.pnl), 0) * 0.20;

  const chartData = [
    { name: 'STCG', value: totalSTCG, tax: stcgTax },
    { name: 'LTCG', value: totalLTCG, tax: ltcgTax },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* FY Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Financial Year:</span>
          <button className="btn-secondary text-xs py-1.5 flex items-center gap-1">{fy} <ChevronDown className="w-3 h-3" /></button>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-1.5"><Download className="w-3.5 h-3.5" /> PDF</button>
          <button className="btn-secondary text-xs py-1.5"><FileText className="w-3.5 h-3.5" /> ITR-2 Format</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total STCG', value: formatCurrency(totalSTCG), sub: `Tax @ 20%: ${formatCurrency(stcgTax)}`, color: 'from-blue-500/20 to-blue-500/5' },
          { label: 'Total LTCG', value: formatCurrency(totalLTCG), sub: `Tax @ 12.5%: ${formatCurrency(ltcgTax)}`, color: 'from-purple-500/20 to-purple-500/5' },
          { label: 'LTCG Exemption Used', value: `${formatCurrency(Math.min(totalLTCG, ltcgExemption))} / ${formatCurrency(ltcgExemption)}`, sub: `Remaining: ${formatCurrency(Math.max(0, ltcgExemption - totalLTCG))}`, color: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'Total Tax Payable', value: formatCurrency(totalTax), sub: 'STCG + LTCG combined', color: 'from-amber-500/20 to-amber-500/5' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card bg-gradient-to-br ${s.color}`}>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gains Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Capital Gains Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => formatCurrency(v, true)} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="value" name="Gain" radius={[4, 4, 0, 0]}>
                <Cell fill="#6366f1" /><Cell fill="#8b5cf6" />
              </Bar>
              <Bar dataKey="tax" name="Tax" radius={[4, 4, 0, 0]}>
                <Cell fill="#ef4444" /><Cell fill="#ef4444" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tax Harvesting */}
        {lossMakers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="xl:col-span-2 p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Lightbulb className="w-5 h-5 text-amber-400" /></div>
              <div>
                <h3 className="text-sm font-semibold text-amber-400">Tax Harvesting Opportunity</h3>
                <p className="text-xs text-amber-400/70 mt-1">You can save up to <strong>{formatCurrency(potentialSavings)}</strong> in taxes by selling these stocks before March 31 to book losses and offset your capital gains.</p>
              </div>
            </div>
            <div className="space-y-2">
              {lossMakers.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20">
                  <div>
                    <div className="text-sm font-medium text-foreground">{h.symbol}</div>
                    <div className="text-xs text-muted-foreground">{h.quantity} shares @ {formatCurrency(h.averagePrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-loss">{formatCurrency(h.pnl)}</div>
                    <div className="text-xs text-muted-foreground">Tax saving: {formatCurrency(Math.abs(h.pnl) * 0.20)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Detailed Gains Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-5 pb-3"><h2 className="text-sm font-semibold text-foreground">Realized Capital Gains</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-y border-border">
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Buy Date</th>
                <th className="px-4 py-3 text-left">Sell Date</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Buy Price</th>
                <th className="px-4 py-3 text-right">Sell Price</th>
                <th className="px-4 py-3 text-right">Gain/Loss</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-right">Tax</th>
              </tr>
            </thead>
            <tbody>
              {mockCapitalGains.map((g) => (
                <tr key={g.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-foreground">{g.companyName}<div className="text-xs text-muted-foreground">{g.symbol}</div></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(g.buyDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(g.sellDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-foreground">{g.quantity}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(g.buyPrice)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(g.sellPrice)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${g.gain >= 0 ? 'text-profit' : 'text-loss'}`}>{formatCurrency(g.gain)}</td>
                  <td className="px-4 py-3 text-center"><span className={`badge ${g.type === 'STCG' ? 'badge-loss' : 'badge-profit'}`}>{g.type}</span></td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(g.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
