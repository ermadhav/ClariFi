'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield, CreditCard, Link2, Monitor, Moon, Sun, Smartphone } from 'lucide-react';

import { BrokerConnectCard } from '@/components/brokers/BrokerConnectCard';

export default function SettingsPage() {
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState({ price: true, news: true, portfolio: true, dividends: true, sip: true, email: false, sms: false, push: true });
  const [brokers, setBrokers] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/brokers/status')
      .then(res => res.json())
      .then(data => {
        if (data.brokerAccounts) {
          setBrokers(data.brokerAccounts);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 animate-in max-w-3xl">
      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><User className="w-4 h-4 text-indigo-400" /> Profile</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">JD</div>
          <div><div className="text-foreground font-medium">John Doe</div><div className="text-xs text-muted-foreground">john.doe@email.com</div></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-muted-foreground mb-1.5 block">Name</label><input defaultValue="John Doe" className="input-field" /></div>
          <div><label className="text-xs text-muted-foreground mb-1.5 block">Email</label><input defaultValue="john.doe@email.com" className="input-field" /></div>
          <div><label className="text-xs text-muted-foreground mb-1.5 block">Phone</label><input defaultValue="+91 98765 43210" className="input-field" /></div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Risk Appetite</label>
            <select defaultValue="Moderate" className="input-field"><option value="Conservative">Conservative</option><option value="Moderate">Moderate</option><option value="Aggressive">Aggressive</option></select>
          </div>
        </div>
        <button className="btn-primary text-xs mt-4">Save Changes</button>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-400" /> Notifications</h2>
        <div className="space-y-3">
          {[
            { key: 'price', label: 'Price Alerts', desc: 'Get notified when stocks hit target prices' },
            { key: 'news', label: 'News Alerts', desc: 'Important news about your holdings' },
            { key: 'portfolio', label: 'Portfolio Updates', desc: 'Daily portfolio summary and milestones' },
            { key: 'dividends', label: 'Dividend Reminders', desc: 'Upcoming ex-dates and payment dates' },
            { key: 'sip', label: 'SIP Reminders', desc: 'Monthly SIP due date reminders' },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02]">
              <div><div className="text-sm text-foreground">{n.label}</div><div className="text-xs text-muted-foreground">{n.desc}</div></div>
              <button onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key as keyof typeof notifications] })} className={`w-10 h-5 rounded-full transition-all relative ${notifications[n.key as keyof typeof notifications] ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifications[n.key as keyof typeof notifications] ? 'left-5.5' : 'left-0.5'}`} style={{ left: notifications[n.key as keyof typeof notifications] ? '22px' : '2px' }} />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-4 pt-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Delivery Method</div>
          <div className="flex gap-3">
            {[
              { key: 'push', label: 'Push', icon: Smartphone },
              { key: 'email', label: 'Email', icon: Monitor },
              { key: 'sms', label: 'SMS', icon: Monitor },
            ].map((m) => (
              <button key={m.key} onClick={() => setNotifications({ ...notifications, [m.key]: !notifications[m.key as keyof typeof notifications] })} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${notifications[m.key as keyof typeof notifications] ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-border bg-white/5 text-muted-foreground'}`}>
                <m.icon className="w-3.5 h-3.5" /> {m.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-indigo-400" /> Appearance</h2>
        <div className="flex gap-3">
          {[
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'auto', label: 'System', icon: Monitor },
          ].map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all flex-1 ${theme === t.id ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-border bg-white/5 text-muted-foreground'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Connected Brokers */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Link2 className="w-4 h-4 text-indigo-400" /> Connected Brokers</h2>
        <div className="space-y-4">
          <BrokerConnectCard
            broker="ZERODHA"
            isConnected={brokers.find(b => b.brokerName === 'ZERODHA')?.isConnected || false}
            lastSynced={brokers.find(b => b.brokerName === 'ZERODHA')?.lastSynced}
          />
          <BrokerConnectCard
            broker="UPSTOX"
            isConnected={brokers.find(b => b.brokerName === 'UPSTOX')?.isConnected || false}
            lastSynced={brokers.find(b => b.brokerName === 'UPSTOX')?.lastSynced}
          />
          <BrokerConnectCard
            broker="ANGEL_ONE"
            isConnected={brokers.find(b => b.brokerName === 'ANGEL_ONE')?.isConnected || false}
            lastSynced={brokers.find(b => b.brokerName === 'ANGEL_ONE')?.lastSynced}
          />
        </div>
      </motion.div>

      {/* Subscription */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-400" /> Subscription</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'Free', price: '₹0', features: ['25 stocks', 'Basic charts', '5 alerts'], active: false },
            { name: 'Pro', price: '₹499/mo', features: ['Unlimited stocks', 'Advanced charts', 'AI insights', 'No ads'], active: true },
            { name: 'Premium', price: '₹999/mo', features: ['Everything in Pro', 'Price predictions', 'API access', 'Priority support'], active: false },
          ].map((p) => (
            <div key={p.name} className={`p-4 rounded-xl border transition-all ${p.active ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-border bg-white/[0.02]'}`}>
              {p.active && <span className="badge badge-info mb-2">Current Plan</span>}
              <div className="text-lg font-bold text-foreground">{p.name}</div>
              <div className="text-sm text-indigo-400 font-medium mb-3">{p.price}</div>
              <ul className="space-y-1">
                {p.features.map((f) => <li key={f} className="text-xs text-muted-foreground">✓ {f}</li>)}
              </ul>
              {!p.active && <button className="btn-secondary text-xs w-full mt-3">{p.name === 'Free' ? 'Downgrade' : 'Upgrade'}</button>}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
