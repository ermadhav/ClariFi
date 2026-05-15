'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { mockDividends } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Calendar, Download, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DividendsPage() {
  const totalDividend = mockDividends.reduce((s, d) => s + d.totalDividend, 0);
  const totalTDS = mockDividends.reduce((s, d) => s + d.tdsDeducted, 0);
  const totalNet = mockDividends.reduce((s, d) => s + d.netAmount, 0);

  const chartData = mockDividends.map((d) => ({
    stock: d.symbol,
    amount: d.totalDividend,
    tds: d.tdsDeducted,
  }));

  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Dividends', value: formatCurrency(totalDividend), icon: DollarSign, color: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'TDS Deducted', value: formatCurrency(totalTDS), icon: Calendar, color: 'from-red-500/20 to-red-500/5' },
          { label: 'Net Received', value: formatCurrency(totalNet), icon: TrendingUp, color: 'from-indigo-500/20 to-indigo-500/5' },
          { label: 'Dividend Stocks', value: mockDividends.length.toString(), icon: DollarSign, color: 'from-amber-500/20 to-amber-500/5' },
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Dividend by Stock</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v: number) => `₹${v}`} />
              <YAxis type="category" dataKey="stock" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={60} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="amount" name="Dividend" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="xl:col-span-2 glass-card overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Dividend History</h2>
            <button className="btn-secondary text-xs py-1.5"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
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
                {mockDividends.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-foreground">{d.symbol}<div className="text-xs text-muted-foreground">{d.companyName}</div></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(d.exDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-foreground">₹{d.dividendPerShare}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{d.quantityHeld}</td>
                    <td className="px-4 py-3 text-right text-profit font-medium">{formatCurrency(d.totalDividend)}</td>
                    <td className="px-4 py-3 text-right text-loss">{formatCurrency(d.tdsDeducted)}</td>
                    <td className="px-4 py-3 text-right text-foreground font-medium">{formatCurrency(d.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
