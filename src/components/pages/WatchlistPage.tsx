'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockWatchlistStocks, mockHoldings } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Plus, Star, Bell, BarChart3, Search, GripVertical, Trash2, Eye } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/lib/store';

const watchlists = [
  { id: 'holdings', name: 'My Holdings', color: '#6366f1', isDefault: true },
  { id: 'watchlist', name: 'Keep an Eye', color: '#f59e0b', isDefault: true },
  { id: 'dividend', name: 'High Dividend', color: '#22c55e', isDefault: false },
];

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={positive ? 'sparkGreen' : 'sparkRed'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
            <stop offset="100%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={positive ? '#22c55e' : '#ef4444'} strokeWidth={1.5} fill={`url(#${positive ? 'sparkGreen' : 'sparkRed'})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState('watchlist');
  const [search, setSearch] = useState('');
  const { setActivePage } = useAppStore();

  const [holdings, setHoldings] = useState<any[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [holdingsRes, watchlistRes] = await Promise.all([
        fetch('/api/holdings'),
        fetch('/api/watchlist')
      ]);
      
      if (holdingsRes.ok) {
        const hData = await holdingsRes.json();
        const mappedHoldings = (hData.holdings || []).map((h: any) => ({
          symbol: h.symbol || h.stockSymbol?.split(':')[1] || 'UNKNOWN',
          companyName: h.companyName,
          currentPrice: h.currentPrice,
          dayChange: h.dayChange,
          dayChangePercent: h.dayChangePercent,
          sector: h.sector || 'Uncategorized',
          marketCap: h.marketCap,
          pe: h.pe || 0,
          sparklineData: Array.from({ length: 20 }, (_, i) => h.currentPrice + (Math.random() - 0.5) * h.currentPrice * 0.02),
          high52w: h.high52w || h.currentPrice * 1.2,
          low52w: h.low52w || h.currentPrice * 0.8
        }));
        setHoldings(mappedHoldings);
      }

      if (watchlistRes.ok) {
        const wData = await watchlistRes.json();
        setWatchlistStocks(wData.stocks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddStock = async () => {
    if (!search.trim()) {
      alert("Please enter a stock symbol in the search box to add (e.g., RELIANCE).");
      return;
    }
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: search.trim().toUpperCase() })
      });
      if (res.ok) {
        setSearch('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stocks = activeTab === 'holdings' ? holdings : watchlistStocks;

  const filtered = stocks.filter((s) =>
    s.companyName?.toLowerCase().includes(search.toLowerCase()) || s.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Tabs + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {watchlists.map((w) => (
            <button key={w.id} onClick={() => setActiveTab(w.id)} className={`tab-button flex items-center gap-1.5 ${activeTab === w.id ? 'active' : ''}`}>
              <span className="w-2 h-2 rounded-full" style={{ background: w.color }} />
              {w.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stocks..." className="input-field pl-9 py-1.5 text-xs w-48" />
          </div>
          <button onClick={handleAddStock} className="btn-primary text-xs py-1.5"><Plus className="w-3.5 h-3.5" /> Add Stock</button>
        </div>
      </div>

      {/* Stock Cards */}
      <div className="space-y-2">
        {filtered.map((s, i) => {
          const pos52 = ((s.currentPrice - s.low52w) / (s.high52w - s.low52w)) * 100;
          return (
            <motion.div
              key={s.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card glass-card-hover p-4 cursor-pointer"
              onClick={() => setActivePage('stock-' + s.symbol)}
            >
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 flex-shrink-0">
                  {s.symbol.substring(0, 2)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{s.companyName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{s.symbol}</span>
                    <span className="badge badge-info">{s.sector}</span>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="hidden md:block flex-shrink-0">
                  <MiniSparkline data={s.sparklineData} positive={s.dayChangePercent >= 0} />
                </div>

                {/* 52W Bar */}
                <div className="hidden lg:block w-24 flex-shrink-0">
                  <div className="text-[10px] text-muted-foreground mb-1 flex justify-between">
                    <span>52W</span>
                    <span>{pos52.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-loss via-warning to-profit" style={{ width: `${pos52}%` }} />
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 min-w-[100px]">
                  <div className="text-sm font-semibold text-foreground">{formatCurrency(s.currentPrice)}</div>
                  <div className={`text-xs font-medium flex items-center justify-end gap-1 ${s.dayChangePercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {s.dayChangePercent >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(s.dayChange))} ({formatPercent(s.dayChangePercent)})
                  </div>
                </div>

                {/* PE */}
                <div className="hidden lg:block text-right flex-shrink-0 w-16">
                  <div className="text-[10px] text-muted-foreground">P/E</div>
                  <div className="text-xs text-foreground font-medium">{s.pe.toFixed(1)}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"><Star className="w-3.5 h-3.5 text-amber-400" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"><Bell className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No stocks found. {activeTab !== 'holdings' && "Type a symbol in the search box and click 'Add Stock'."}
          </div>
        )}
      </div>
    </div>
  );
}
