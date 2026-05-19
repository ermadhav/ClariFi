'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { Bell, Plus, BellRing, BellOff, Trash2, CheckCircle, Clock, TrendingUp, AlertTriangle, X, Search, Edit2, ToggleLeft, ToggleRight, ArrowUpRight, ArrowDownRight, Activity, Target, Shield, Landmark, BarChart3, Loader2 } from 'lucide-react';

interface AlertItem {
  id: string; symbol?: string; companyName?: string; type: string;
  condition: string; conditionParams?: any; targetValue?: number;
  isActive: boolean; triggered: boolean; triggeredAt?: string;
  triggeredCount: number; cooldownMinutes: number;
  notifyInApp: boolean; notifyEmail: boolean; notifySMS: boolean;
  createdAt: string; updatedAt: string;
}

const ALERT_CATEGORIES = [
  { label: 'Price & Movement', types: [
    { value: 'PRICE_ABOVE', label: 'Price Above', icon: '📈', desc: 'Alert when stock price goes above target' },
    { value: 'PRICE_BELOW', label: 'Price Below', icon: '📉', desc: 'Alert when stock price drops below target' },
    { value: 'PERCENT_CHANGE', label: '% Change', icon: '📊', desc: 'Alert on percentage move (up or down)' },
    { value: 'WEEK52_HIGH', label: '52-Week High', icon: '🚀', desc: 'Alert when stock hits 52-week high' },
    { value: 'WEEK52_LOW', label: '52-Week Low', icon: '⚠️', desc: 'Alert when stock hits 52-week low' },
    { value: 'VOLUME_SPIKE', label: 'Volume Spike', icon: '📊', desc: 'Alert on unusual volume activity' },
  ]},
  { label: 'Portfolio & P&L', types: [
    { value: 'DAILY_PNL', label: 'Daily P&L', icon: '💰', desc: 'Alert on daily portfolio gain/loss' },
    { value: 'DRAWDOWN', label: 'Drawdown', icon: '📉', desc: 'Alert when portfolio drops from peak' },
  ]},
  { label: 'Risk & Allocation', types: [
    { value: 'ALLOCATION_DRIFT', label: 'Allocation Drift', icon: '⚖️', desc: 'Alert when allocation deviates from target' },
    { value: 'SECTOR_CONCENTRATION', label: 'Sector Risk', icon: '🏭', desc: 'Alert on sector over-concentration' },
    { value: 'STOCK_OVEREXPOSURE', label: 'Stock Overexposure', icon: '⚠️', desc: 'Alert when single stock exceeds % of portfolio' },
  ]},
  { label: 'Events & Fundamentals', types: [
    { value: 'DIVIDEND_DECLARED', label: 'Dividend', icon: '💵', desc: 'Alert on dividend announcements' },
    { value: 'EARNINGS_UPCOMING', label: 'Earnings', icon: '📅', desc: 'Alert before earnings date' },
    { value: 'PE_RATIO', label: 'P/E Ratio', icon: '📐', desc: 'Alert on P/E threshold' },
    { value: 'TAX_HARVESTING', label: 'Tax Harvesting', icon: '💡', desc: 'Alert on tax-loss harvesting opportunities' },
    { value: 'BUY_DIP', label: 'Buy the Dip', icon: '🛒', desc: 'Alert when watchlist stock drops significantly' },
  ]},
];

const NEEDS_STOCK = ['PRICE_ABOVE','PRICE_BELOW','PERCENT_CHANGE','WEEK52_HIGH','WEEK52_LOW','VOLUME_SPIKE','DIVIDEND_DECLARED','EARNINGS_UPCOMING','PE_RATIO','BUY_DIP','STOCK_OVEREXPOSURE'];
const NEEDS_VALUE = ['PRICE_ABOVE','PRICE_BELOW','PERCENT_CHANGE','VOLUME_SPIKE','DAILY_PNL','DRAWDOWN','ALLOCATION_DRIFT','SECTOR_CONCENTRATION','STOCK_OVEREXPOSURE','PE_RATIO','BUY_DIP'];

function getAlertIcon(type: string) {
  const flat = ALERT_CATEGORIES.flatMap(c => c.types);
  return flat.find(t => t.value === type)?.icon || '🔔';
}
function getAlertLabel(type: string) {
  const flat = ALERT_CATEGORIES.flatMap(c => c.types);
  return flat.find(t => t.value === type)?.label || type;
}

function buildConditionText(type: string, symbol?: string, targetValue?: number): string {
  const s = symbol || 'Portfolio';
  const v = targetValue ?? 0;
  switch (type) {
    case 'PRICE_ABOVE': return `${s} price reaches ₹${v.toLocaleString('en-IN')}`;
    case 'PRICE_BELOW': return `${s} price drops below ₹${v.toLocaleString('en-IN')}`;
    case 'PERCENT_CHANGE': return `${s} moves ${v}% in a day`;
    case 'WEEK52_HIGH': return `${s} hits 52-week high`;
    case 'WEEK52_LOW': return `${s} hits 52-week low`;
    case 'VOLUME_SPIKE': return `${s} volume exceeds ${v}x average`;
    case 'DAILY_PNL': return `Portfolio daily P&L exceeds ₹${v.toLocaleString('en-IN')}`;
    case 'DRAWDOWN': return `Portfolio drawdown exceeds ${v}%`;
    case 'ALLOCATION_DRIFT': return `Allocation drifts by more than ${v}%`;
    case 'SECTOR_CONCENTRATION': return `Sector concentration exceeds ${v}%`;
    case 'STOCK_OVEREXPOSURE': return `${s} exceeds ${v}% of portfolio`;
    case 'DIVIDEND_DECLARED': return `${s} declares dividend`;
    case 'EARNINGS_UPCOMING': return `${s} earnings approaching`;
    case 'PE_RATIO': return `${s} P/E ratio crosses ${v}`;
    case 'TAX_HARVESTING': return `Tax harvesting opportunity detected`;
    case 'BUY_DIP': return `${s} drops ${v}% — buy-the-dip opportunity`;
    default: return `Custom alert for ${s}`;
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState({ active: 0, triggered: 0, total: 0 });
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Modal state
  const [modalStep, setModalStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [modalSymbol, setModalSymbol] = useState('');
  const [modalCompany, setModalCompany] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalNotifyInApp, setModalNotifyInApp] = useState(true);
  const [modalNotifyEmail, setModalNotifyEmail] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setStats(data.stats || { active: 0, triggered: 0, total: 0 });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      setAlerts(prev => prev.filter(a => a.id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentActive } : a));
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    setCreating(true);
    const condition = buildConditionText(selectedType, modalSymbol || undefined, modalValue ? parseFloat(modalValue) : undefined);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          symbol: modalSymbol || null,
          companyName: modalCompany || modalSymbol || null,
          condition,
          targetValue: modalValue || null,
          conditionParams: { type: selectedType, symbol: modalSymbol, value: parseFloat(modalValue) || null },
          notifyInApp: modalNotifyInApp,
          notifyEmail: modalNotifyEmail,
        }),
      });
      if (res.ok) {
        resetModal();
        fetchAlerts();
      }
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const resetModal = () => {
    setShowModal(false); setModalStep(1); setSelectedType('');
    setModalSymbol(''); setModalCompany(''); setModalValue('');
    setModalNotifyInApp(true); setModalNotifyEmail(false);
  };

  const filtered = alerts.filter(a => {
    if (filter === 'active') return a.isActive && !a.triggered;
    if (filter === 'triggered') return a.triggered;
    return true;
  }).filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.symbol?.toLowerCase().includes(q) || a.companyName?.toLowerCase().includes(q) || a.condition.toLowerCase().includes(q));
  });

  const needsStock = NEEDS_STOCK.includes(selectedType);
  const needsValue = NEEDS_VALUE.includes(selectedType);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['all', 'active', 'triggered'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`tab-button ${filter === f ? 'active' : ''}`}>
              {f === 'all' ? 'All' : f === 'active' ? '🔔 Active' : '✅ Triggered'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alerts..." className="input-field pl-9 py-1.5 text-xs w-48" />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs py-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Alert
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Alerts', value: stats.active, icon: BellRing, color: 'from-indigo-500/20 to-indigo-500/5' },
          { label: 'Triggered', value: stats.triggered, icon: CheckCircle, color: 'from-emerald-500/20 to-emerald-500/5' },
          { label: 'Total Alerts', value: stats.total, icon: Bell, color: 'from-purple-500/20 to-purple-500/5' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`stat-card bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center justify-between">
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div><div className="text-2xl font-bold text-foreground">{s.value}</div></div>
              <s.icon className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="glass-card p-4 border-indigo-500/20 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-xs text-muted-foreground"><strong className="text-foreground">Alert Prerequisites:</strong> To receive alerts for a stock, add it to any watchlist first. Alerts are checked during market hours (9:15 AM - 3:30 PM IST).</p>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass-card p-4 h-20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {search ? 'No matching alerts' : 'No alerts set yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Set up alerts to get notified about important price movements, portfolio changes, and market events.
          </p>
          {!search && <button onClick={() => setShowModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4 inline mr-1" />Create Your First Alert</button>}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                className={`glass-card glass-card-hover p-4 flex items-center justify-between ${a.triggered ? 'border-profit/20' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${a.triggered ? 'bg-profit/10' : a.isActive ? 'bg-indigo-500/10' : 'bg-white/5'}`}>
                    {a.triggered ? <CheckCircle className="w-5 h-5 text-profit" /> : getAlertIcon(a.type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {a.companyName || a.symbol || 'Portfolio Alert'}
                      {a.symbol && <span className="text-muted-foreground ml-1">({a.symbol})</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.condition}</div>
                    {a.triggered && a.triggeredAt && (
                      <div className="text-xs text-profit mt-0.5">Triggered on {new Date(a.triggeredAt).toLocaleDateString('en-IN')}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.triggered ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : a.isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>
                    {a.triggered ? 'Triggered' : a.isActive ? 'Active' : 'Paused'}
                  </span>
                  <button onClick={() => handleToggle(a.id, a.isActive)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title={a.isActive ? 'Pause' : 'Resume'}>
                    {a.isActive ? <ToggleRight className="w-4 h-4 text-indigo-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                    {deleting === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={resetModal}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg mx-4 bg-[#0c0c0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-base font-semibold text-foreground">
                  {modalStep === 1 ? '🔔 Select Alert Type' : modalStep === 2 ? '⚙️ Configure Alert' : '✅ Review & Create'}
                </h3>
                <button onClick={resetModal} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {modalStep === 1 && (
                  <div className="space-y-4">
                    {ALERT_CATEGORIES.map(cat => (
                      <div key={cat.label}>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {cat.types.map(t => (
                            <button key={t.value} onClick={() => { setSelectedType(t.value); setModalStep(2); }}
                              className="text-left p-3 rounded-xl border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group">
                              <div className="text-sm mb-0.5"><span className="mr-1.5">{t.icon}</span><span className="font-medium text-foreground group-hover:text-indigo-300">{t.label}</span></div>
                              <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {modalStep === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <span>{getAlertIcon(selectedType)}</span>
                      <span className="text-sm font-medium text-indigo-300">{getAlertLabel(selectedType)}</span>
                    </div>

                    {needsStock && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">Stock Symbol</label>
                        <input value={modalSymbol} onChange={e => setModalSymbol(e.target.value.toUpperCase())} placeholder="e.g. RELIANCE, TCS, INFY" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50" />
                      </div>
                    )}
                    {needsStock && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">Company Name (optional)</label>
                        <input value={modalCompany} onChange={e => setModalCompany(e.target.value)} placeholder="e.g. Reliance Industries" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50" />
                      </div>
                    )}
                    {needsValue && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">
                          {['PERCENT_CHANGE','DRAWDOWN','ALLOCATION_DRIFT','SECTOR_CONCENTRATION','STOCK_OVEREXPOSURE','BUY_DIP'].includes(selectedType) ? 'Percentage (%)' : ['VOLUME_SPIKE'].includes(selectedType) ? 'Multiplier (e.g. 2 for 2x)' : 'Target Value (₹)'}
                        </label>
                        <input type="number" value={modalValue} onChange={e => setModalValue(e.target.value)} placeholder="Enter value" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50" />
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">Notifications</label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={modalNotifyInApp} onChange={e => setModalNotifyInApp(e.target.checked)} className="accent-indigo-500" />
                          <span className="text-xs text-foreground">In-App</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={modalNotifyEmail} onChange={e => setModalNotifyEmail(e.target.checked)} className="accent-indigo-500" />
                          <span className="text-xs text-foreground">Email</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="text-foreground font-medium">{getAlertIcon(selectedType)} {getAlertLabel(selectedType)}</span></div>
                      {modalSymbol && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Stock</span><span className="text-foreground font-medium">{modalCompany || modalSymbol} ({modalSymbol})</span></div>}
                      {modalValue && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Target</span><span className="text-foreground font-medium">{modalValue}</span></div>}
                      <div className="border-t border-white/5 pt-3"><div className="text-xs text-muted-foreground mb-1">Condition</div><div className="text-sm text-indigo-300 font-medium">{buildConditionText(selectedType, modalSymbol, parseFloat(modalValue))}</div></div>
                      <div className="flex gap-2 text-xs">
                        {modalNotifyInApp && <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">In-App</span>}
                        {modalNotifyEmail && <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Email</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <button onClick={() => { if (modalStep > 1) setModalStep(modalStep - 1); else resetModal(); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {modalStep === 1 ? 'Cancel' : '← Back'}
                </button>
                {modalStep < 3 ? (
                  <button onClick={() => setModalStep(modalStep + 1)}
                    disabled={modalStep === 1 ? !selectedType : (needsStock && !modalSymbol) || (needsValue && !modalValue)}
                    className="btn-primary text-xs py-1.5 disabled:opacity-30 disabled:cursor-not-allowed">
                    Next →
                  </button>
                ) : (
                  <button onClick={handleCreate} disabled={creating} className="btn-primary text-xs py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {creating ? 'Creating...' : 'Create Alert'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
