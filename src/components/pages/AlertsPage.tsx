'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockAlerts } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { Bell, Plus, BellRing, BellOff, Trash2, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');
  const filtered = mockAlerts.filter((a) => {
    if (filter === 'active') return a.isActive && !a.triggered;
    if (filter === 'triggered') return a.triggered;
    return true;
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['all', 'active', 'triggered'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`tab-button ${filter === f ? 'active' : ''}`}>
              {f === 'all' ? 'All' : f === 'active' ? '🔔 Active' : '✅ Triggered'}
            </button>
          ))}
        </div>
        <button className="btn-primary text-xs py-1.5"><Plus className="w-3.5 h-3.5" /> New Alert</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Alerts', value: mockAlerts.filter((a) => a.isActive && !a.triggered).length, icon: BellRing, color: 'from-indigo-500/20 to-indigo-500/5' },
          { label: 'Triggered', value: mockAlerts.filter((a) => a.triggered).length, icon: CheckCircle, color: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'Total Alerts', value: mockAlerts.length, icon: Bell, color: 'from-purple-500/20 to-purple-500/5' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center justify-between">
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div><div className="text-2xl font-bold text-foreground">{s.value}</div></div>
              <s.icon className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`glass-card p-4 flex items-center justify-between ${a.triggered ? 'border-profit/20' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.triggered ? 'bg-profit/10' : 'bg-indigo-500/10'}`}>
                {a.triggered ? <CheckCircle className="w-5 h-5 text-profit" /> : <BellRing className="w-5 h-5 text-indigo-400" />}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{a.companyName} ({a.symbol})</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.condition}</div>
                {a.triggered && a.triggeredAt && <div className="text-xs text-profit mt-0.5">Triggered on {new Date(a.triggeredAt).toLocaleDateString('en-IN')}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${a.triggered ? 'badge-profit' : a.isActive ? 'badge-info' : 'badge-neutral'}`}>
                {a.triggered ? 'Triggered' : a.isActive ? 'Active' : 'Paused'}
              </span>
              <button className="p-1.5 rounded-lg hover:bg-white/5"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
