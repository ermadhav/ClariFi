'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockTransactions } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { Plus, Download, Filter, Search, ArrowUpCircle, ArrowDownCircle, Calendar, FileSpreadsheet } from 'lucide-react';

export default function TransactionsPage() {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = mockTransactions.filter((t) => {
    if (filter !== 'ALL' && t.type !== filter) return false;
    if (search && !t.companyName.toLowerCase().includes(search.toLowerCase()) && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalBuy = mockTransactions.filter((t) => t.type === 'BUY').reduce((s, t) => s + t.totalAmount, 0);
  const totalSell = mockTransactions.filter((t) => t.type === 'SELL').reduce((s, t) => s + t.totalAmount, 0);
  const totalBrokerage = mockTransactions.reduce((s, t) => s + t.brokerage, 0);

  return (
    <div className="space-y-6 animate-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Transactions', value: mockTransactions.length.toString(), color: 'from-indigo-500/20 to-indigo-500/5' },
          { label: 'Total Bought', value: formatCurrency(totalBuy), color: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'Total Sold', value: formatCurrency(totalSell), color: 'from-purple-500/20 to-purple-500/5' },
          { label: 'Total Brokerage', value: formatCurrency(totalBrokerage), color: 'from-amber-500/20 to-amber-500/5' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card bg-gradient-to-br ${s.color}`}>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`tab-button ${filter === f ? 'active' : ''}`}>{f === 'ALL' ? 'All' : f === 'BUY' ? '🟢 Buy' : '🔴 Sell'}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-9 py-1.5 text-xs w-40" />
          </div>
          <button className="btn-secondary text-xs py-1.5"><Download className="w-3.5 h-3.5" /> Export</button>
          <button className="btn-primary text-xs py-1.5"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Brokerage</th>
                <th className="px-4 py-3 text-left">Broker</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{t.companyName}</div>
                    <div className="text-xs text-muted-foreground">{t.symbol}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${t.type === 'BUY' ? 'badge-profit' : 'badge-loss'} flex items-center gap-1 w-fit`}>
                      {t.type === 'BUY' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />} {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{t.quantity}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(t.pricePerShare)}</td>
                  <td className="px-4 py-3 text-right text-foreground font-medium">{formatCurrency(t.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(t.brokerage)}</td>
                  <td className="px-4 py-3"><span className="badge badge-info">{t.broker}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
