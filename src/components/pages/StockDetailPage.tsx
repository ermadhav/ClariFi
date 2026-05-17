'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Plus, Download, Link as LinkIcon, TrendingUp, TrendingDown, Loader2, Bell, Share2, Check, X } from 'lucide-react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';

const TableSection = ({ title, data, cols }: { title: string, data: any[], cols: string[] }) => {
  if (!data || data.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6 mt-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-muted-foreground">
              <th className="text-left font-medium py-3 px-2 min-w-[150px]">Data</th>
              {cols.map((c, i) => <th key={i} className="text-right font-medium py-3 px-2 min-w-[80px]">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${row.metric?.includes('Profit') ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                <td className="py-2.5 px-2">{row.metric}</td>
                {cols.map((k) => (
                  <td key={k} className="text-right py-2.5 px-2">
                     {row[k] !== undefined ? (typeof row[k] === 'number' ? row[k].toLocaleString('en-IN') : row[k]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default function StockDetailPage({ symbol }: { symbol: string }) {
  const { setActivePage } = useAppStore();
  const [stock, setStock] = useState<any>(null);
  const [screener, setScreener] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('1Yr');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  
  // Chart toggles
  const [showPrice, setShowPrice] = useState(true);
  const [show50DMA, setShow50DMA] = useState(false);
  const [show200DMA, setShow200DMA] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Watchlist
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [showWatchlistMenu, setShowWatchlistMenu] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  const rangeMap: Record<string, string> = {
    '1M': '1mo', '6M': '6mo', '1Yr': '1y', '3Yr': '3y', '5Yr': '5y', '10Yr': '10y', 'Max': 'max'
  };

  useEffect(() => {
    // Fetch user watchlists
    fetch('/api/watchlist').then(res => res.json()).then(data => {
      if (data.watchlists) setWatchlists(data.watchlists);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [quoteRes, screenerRes] = await Promise.all([
          fetch(`/api/stocks/${symbol}?range=${rangeMap[chartPeriod]}`),
          fetch(`/api/stocks/${symbol}/screener`)
        ]);
        
        if (quoteRes.ok) setStock(await quoteRes.json());
        if (screenerRes.ok) setScreener(await screenerRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [symbol, chartPeriod]);

  if (loading && !stock) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  if (!stock || stock.error) return (
    <div className="text-center py-20 glass-card">
      <p className="text-muted-foreground">Stock details not found.</p>
      <button onClick={() => setActivePage('dashboard')} className="btn-primary text-xs mt-4">Go Back</button>
    </div>
  );

  const cleanSymbol = stock.symbol.replace('.NS', '').replace('.BO', '');
  
  const chartData = useMemo(() => {
    if (!stock?.historical) return [];
    const data = [...stock.historical];
    for (let i = 0; i < data.length; i++) {
      if (i >= 49) {
        let sum = 0;
        for (let j = i - 49; j <= i; j++) sum += data[j].close;
        data[i].dma50 = sum / 50;
      }
      if (i >= 199) {
        let sum = 0;
        for (let j = i - 199; j <= i; j++) sum += data[j].close;
        data[i].dma200 = sum / 200;
      }
    }
    return data;
  }, [stock?.historical]);

  // Check if stock is in any watchlist
  const isInWatchlist = (w: any) => w.stocks?.some((s: any) => s.symbol === cleanSymbol);
  const isFollowing = watchlists.some(isInWatchlist);

  const handleToggleWatchlist = async (watchlistId: string, currentlyIn: boolean) => {
    try {
      if (currentlyIn) {
        await fetch(`/api/watchlist?watchlistId=${watchlistId}&symbol=${cleanSymbol}`, { method: 'DELETE' });
      } else {
        await fetch('/api/watchlist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchlistId, symbol: cleanSymbol })
        });
      }
      // Refetch watchlists
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      if (data.watchlists) setWatchlists(data.watchlists);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    try {
      await fetch('/api/watchlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWatchlistName, color: '#818cf8' })
      });
      setNewWatchlistName('');
      // Refetch
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      if (data.watchlists) setWatchlists(data.watchlists);
    } catch (e) { console.error(e); }
  };

  const r = screener?.topRatios || {};

  const mcap = r['Market Cap']?.replace('₹', '').replace('Cr.', '').trim() || (stock.currentPrice * 1234).toFixed(0);
  const pe = r['Stock P/E'] || (stock.pe || 15).toFixed(1);
  const pb = r['Book Value'] || '0';
  const roe = r['ROE'] || '0.0%';
  const roce = r['ROCE'] || '0.0%';
  const divYield = r['Dividend Yield'] || '0.0%';
  const faceValue = r['Face Value'] || '10.0';

  return (
    <div className="space-y-6 animate-in max-w-6xl mx-auto pb-12">
      {/* Back Button */}
      <button onClick={() => setActivePage('dashboard')} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-end gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{stock.companyName}</h1>
            <div className="flex items-center gap-3 pb-1.5">
              <span className="text-2xl font-bold text-foreground">₹{stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <span className={`flex items-center text-sm font-semibold ${stock.dayChange >= 0 ? 'text-profit' : 'text-loss'}`}>
                {stock.dayChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {stock.dayChange > 0 ? '+' : ''}{stock.dayChange.toFixed(2)} ({stock.dayChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <a href={`https://www.${cleanSymbol.toLowerCase()}.com`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
              <LinkIcon className="w-3.5 h-3.5" /> {cleanSymbol.toLowerCase()}.com
            </a>
            <span className="flex items-center gap-1"><span className="text-indigo-400">NSE:</span> {cleanSymbol}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 relative">
          <button className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 border-white/10 hover:bg-white/10">
            <Download className="w-4 h-4" /> EXPORT TO EXCEL
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowWatchlistMenu(!showWatchlistMenu)} 
              className={`btn-primary text-xs px-5 py-2 flex items-center gap-2 transition-all ${isFollowing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              <Plus className={`w-4 h-4 transition-transform ${isFollowing ? 'rotate-45' : ''}`} /> {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </button>
            
            {showWatchlistMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#18181b] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/5 bg-white/5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add to Watchlist</h4>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {watchlists.map(w => {
                    const inThis = isInWatchlist(w);
                    return (
                      <button 
                        key={w.id} 
                        onClick={() => handleToggleWatchlist(w.id, inThis)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="text-sm text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }}></span>
                          {w.name}
                        </span>
                        {inThis && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                <form onSubmit={handleCreateWatchlist} className="p-3 border-t border-white/5 bg-white/[0.02]">
                  <input 
                    type="text" 
                    placeholder="Create new watchlist..." 
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
                  />
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Info Card (Ratios & About) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 border-t-2 border-t-indigo-500/50">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
            <div className="flex flex-col border-b md:border-b-0 border-white/5 pb-2 md:pb-0">
              <span className="text-xs text-muted-foreground mb-1">Market Cap</span>
              <span className="text-sm font-semibold text-foreground">₹ {mcap.toLocaleString('en-IN')} <span className="text-muted-foreground font-normal text-xs">Cr.</span></span>
            </div>
            <div className="flex flex-col border-b md:border-b-0 border-white/5 pb-2 md:pb-0">
              <span className="text-xs text-muted-foreground mb-1">Current Price</span>
              <span className="text-sm font-semibold text-foreground">₹ {stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col border-b md:border-b-0 border-white/5 pb-2 md:pb-0">
              <span className="text-xs text-muted-foreground mb-1">High / Low</span>
              <span className="text-sm font-semibold text-foreground">₹ {stock.high52w.toFixed(0)} / {stock.low52w.toFixed(0)}</span>
            </div>
            <div className="flex flex-col border-b md:border-b-0 border-white/5 pb-2 md:pb-0">
              <span className="text-xs text-muted-foreground mb-1">Stock P/E</span>
              <span className="text-sm font-semibold text-foreground">{pe}</span>
            </div>
            <div className="flex flex-col border-b md:border-b-0 border-white/5 pb-2 md:pb-0">
              <span className="text-xs text-muted-foreground mb-1">Book Value</span>
              <span className="text-sm font-semibold text-foreground">₹ {pb}</span>
            </div>
            <div className="flex flex-col border-b md:border-b-0 border-white/5 pb-2 md:pb-0">
              <span className="text-xs text-muted-foreground mb-1">Dividend Yield</span>
              <span className="text-sm font-semibold text-foreground">{divYield}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">ROCE</span>
              <span className="text-sm font-semibold text-foreground">{roce}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">ROE</span>
              <span className="text-sm font-semibold text-foreground">{roe}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Face Value</span>
              <span className="text-sm font-semibold text-foreground">₹ {faceValue}</span>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Add ratio to table</span>
              <input type="text" placeholder="eg. Promoter holding" className="bg-white/5 border border-white/10 rounded px-3 py-1.5 outline-none focus:border-indigo-500 w-48 text-foreground" />
            </div>
            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">EDIT RATIOS</button>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-2">ABOUT</h3>
          <p className={`text-xs text-muted-foreground leading-relaxed ${showFullAbout ? '' : 'line-clamp-4'}`}>
            {screener?.about || `${stock.companyName} is primarily involved in the core operations related to its sector.`}
          </p>
          
          <h3 className="text-sm font-bold text-foreground mt-6 mb-2">KEY POINTS</h3>
          <style dangerouslySetInnerHTML={{ __html: `
            .screener-key-points p { margin-bottom: 0.5rem; }
            .screener-key-points ul { list-style-type: disc; padding-left: 1rem; margin-bottom: 0.5rem; }
            .screener-key-points strong { color: #fff; font-weight: 600; }
          `}} />
          <div 
            className={`screener-key-points text-xs text-muted-foreground leading-relaxed transition-all duration-300 ${showFullAbout ? '' : 'line-clamp-6'}`}
            dangerouslySetInnerHTML={{ __html: screener?.keyPoints || 'Business Segments data available on full expansion.' }}
          />
          <button 
            onClick={() => setShowFullAbout(!showFullAbout)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-4 uppercase tracking-wider"
          >
            {showFullAbout ? 'Read Less <' : 'Read More >'}
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex border border-white/10 rounded overflow-hidden">
            {['1M', '6M', '1Yr', '3Yr', '5Yr', '10Yr', 'Max'].map(p => (
              <button 
                key={p} 
                onClick={() => setChartPeriod(p)}
                className={`text-xs px-4 py-1.5 font-medium transition-colors ${chartPeriod === p ? 'bg-indigo-500/20 text-indigo-400' : 'text-muted-foreground hover:bg-white/5'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex border border-white/10 rounded overflow-hidden">
              <button className="text-xs px-4 py-1.5 font-medium bg-indigo-500/10 text-indigo-400">Price</button>
              <button className="text-xs px-4 py-1.5 font-medium text-muted-foreground hover:bg-white/5 border-l border-white/10">PE Ratio</button>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })} minTickGap={30} />
            <YAxis yAxisId="price" orientation="right" tick={{ fill: '#71717a', fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v) => `₹${v.toFixed(0)}`} />
            <YAxis yAxisId="vol" orientation="left" hide />
            <RechartsTooltip 
              contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              formatter={(value: any, name: any) => {
                if (name === 'Volume') return [(value / 1000).toFixed(0) + 'k', 'Volume'];
                if (name === 'dma50') return [`₹${Number(value).toFixed(2)}`, '50 DMA'];
                if (name === 'dma200') return [`₹${Number(value).toFixed(2)}`, '200 DMA'];
                return [`₹${Number(value).toFixed(2)}`, 'Price'];
              }}
            />
            {showVolume && <Bar yAxisId="vol" dataKey="volume" fill="#4f46e5" opacity={0.3} maxBarSize={10} />}
            {showPrice && <Area yAxisId="price" type="monotone" dataKey="close" stroke="#818cf8" strokeWidth={2} fillOpacity={0} />}
            {show50DMA && <Line yAxisId="price" type="monotone" dot={false} dataKey="dma50" stroke="#eab308" strokeWidth={1.5} />}
            {show200DMA && <Line yAxisId="price" type="monotone" dot={false} dataKey="dma200" stroke="#ec4899" strokeWidth={1.5} />}
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="accent-indigo-500" /> Price on NSE
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked={show50DMA} onChange={(e) => setShow50DMA(e.target.checked)} className="accent-indigo-500" /> 50 DMA
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked={show200DMA} onChange={(e) => setShow200DMA(e.target.checked)} className="accent-indigo-500" /> 200 DMA
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked={showVolume} onChange={(e) => setShowVolume(e.target.checked)} className="accent-indigo-500" /> Volume
          </label>
        </div>
      </div>

      {/* Financial Tables */}
      <TableSection title="Quarterly Results" data={screener?.quarterlyResults?.rows || []} cols={screener?.quarterlyResults?.headers || []} />
      <TableSection title="Profit & Loss" data={screener?.profitAndLoss?.rows || []} cols={screener?.profitAndLoss?.headers || []} />
      <TableSection title="Balance Sheet" data={screener?.balanceSheet?.rows || []} cols={screener?.balanceSheet?.headers || []} />

    </div>
  );
}

