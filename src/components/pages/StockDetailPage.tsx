'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Plus, Download, Link as LinkIcon, TrendingUp, TrendingDown, Loader2, Bell, Share2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';

// Realistic Mock Data for Financial Tables
const quarterlyResults = [
  { metric: 'Sales', q1: 14200, q2: 15100, q3: 15800, q4: 16500, q5: 17200 },
  { metric: 'Expenses', q1: 11200, q2: 11800, q3: 12200, q4: 12800, q5: 13300 },
  { metric: 'Operating Profit', q1: 3000, q2: 3300, q3: 3600, q4: 3700, q5: 3900 },
  { metric: 'OPM %', q1: '21%', q2: '22%', q3: '23%', q4: '22%', q5: '23%' },
  { metric: 'Other Income', q1: 150, q2: 120, q3: 180, q4: 200, q5: 210 },
  { metric: 'Interest', q1: 300, q2: 290, q3: 280, q4: 270, q5: 260 },
  { metric: 'Depreciation', q1: 400, q2: 410, q3: 420, q4: 430, q5: 440 },
  { metric: 'Profit before tax', q1: 2450, q2: 2720, q3: 3080, q4: 3200, q5: 3410 },
  { metric: 'Net Profit', q1: 1850, q2: 2040, q3: 2310, q4: 2400, q5: 2560 },
];

const profitAndLoss = [
  { metric: 'Sales', y1: 45000, y2: 52000, y3: 58000, y4: 65000, y5: 72000 },
  { metric: 'Expenses', y1: 36000, y2: 41000, y3: 45000, y4: 50000, y5: 55000 },
  { metric: 'Operating Profit', y1: 9000, y2: 11000, y3: 13000, y4: 15000, y5: 17000 },
  { metric: 'OPM %', y1: '20%', y2: '21%', y3: '22%', y4: '23%', y5: '24%' },
  { metric: 'Net Profit', y1: 6500, y2: 7800, y3: 9200, y4: 10500, y5: 12000 },
  { metric: 'EPS in Rs', y1: 12.5, y2: 15.0, y3: 17.6, y4: 20.1, y5: 23.0 },
  { metric: 'Dividend Payout %', y1: '25%', y2: '25%', y3: '30%', y4: '30%', y5: '35%' },
];

const balanceSheet = [
  { metric: 'Equity Capital', y1: 500, y2: 500, y3: 500, y4: 500, y5: 500 },
  { metric: 'Reserves', y1: 25000, y2: 30000, y3: 36000, y4: 43000, y5: 51000 },
  { metric: 'Borrowings', y1: 8000, y2: 7500, y3: 6200, y4: 5800, y5: 4500 },
  { metric: 'Other Liabilities', y1: 12000, y2: 13500, y3: 14200, y4: 15800, y5: 17000 },
  { metric: 'Total Liabilities', y1: 45500, y2: 51500, y3: 56900, y4: 65100, y5: 73000 },
  { metric: 'Fixed Assets', y1: 22000, y2: 24500, y3: 26800, y4: 29000, y5: 32500 },
  { metric: 'CWIP', y1: 1500, y2: 1200, y3: 800, y4: 2100, y5: 1800 },
  { metric: 'Investments', y1: 8500, y2: 10200, y3: 12500, y4: 15000, y5: 18200 },
  { metric: 'Other Assets', y1: 13500, y2: 15600, y3: 16800, y4: 19000, y5: 20500 },
  { metric: 'Total Assets', y1: 45500, y2: 51500, y3: 56900, y4: 65100, y5: 73000 },
];

const TableSection = ({ title, data, cols }: { title: string, data: any[], cols: string[] }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6 mt-6">
    <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-muted-foreground">
            <th className="text-left font-medium py-3 px-2">Data</th>
            {cols.map(c => <th key={c} className="text-right font-medium py-3 px-2">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${row.metric === 'Net Profit' || row.metric === 'Operating Profit' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              <td className="py-2.5 px-2">{row.metric}</td>
              {Object.keys(row).filter(k => k !== 'metric').map(k => (
                <td key={k} className="text-right py-2.5 px-2">{row[k].toLocaleString('en-IN')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

export default function StockDetailPage({ symbol }: { symbol: string }) {
  const { setActivePage } = useAppStore();
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('1Yr');
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(`/api/stocks/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          setStock(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [symbol]);

  if (loading) return (
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
  
  // Deterministic random generators based on symbol for consistent mocks
  const seed = cleanSymbol.charCodeAt(0) + cleanSymbol.charCodeAt(cleanSymbol.length - 1);
  const mcap = Math.floor(stock.currentPrice * (100 + (seed % 500)) * 1.5);
  const pe = (10 + (seed % 60)).toFixed(1);
  const pb = (1 + (seed % 15)).toFixed(1);
  const roe = (8 + (seed % 25)).toFixed(1);
  const roce = (10 + (seed % 25)).toFixed(1);
  const divYield = ((seed % 30) / 10).toFixed(2);
  const bookValue = (stock.currentPrice / parseFloat(pb)).toFixed(2);

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
            <span className="flex items-center gap-1"><span className="text-purple-400">BSE:</span> 5{seed}0{seed % 9}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 border-white/10 hover:bg-white/10">
            <Download className="w-4 h-4" /> EXPORT TO EXCEL
          </button>
          <button onClick={() => setInWatchlist(!inWatchlist)} className={`btn-primary text-xs px-5 py-2 flex items-center gap-2 transition-all ${inWatchlist ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <Plus className={`w-4 h-4 transition-transform ${inWatchlist ? 'rotate-45' : ''}`} /> {inWatchlist ? 'FOLLOWING' : 'FOLLOW'}
          </button>
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
              <span className="text-sm font-semibold text-foreground">₹ {bookValue}</span>
            </div>
            <div className="flex flex-col border-b md:border-b-0 border-white/5 pb-2 md:pb-0">
              <span className="text-xs text-muted-foreground mb-1">Dividend Yield</span>
              <span className="text-sm font-semibold text-foreground">{divYield} %</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">ROCE</span>
              <span className="text-sm font-semibold text-foreground">{roce} %</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">ROE</span>
              <span className="text-sm font-semibold text-foreground">{roe} %</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Face Value</span>
              <span className="text-sm font-semibold text-foreground">₹ {(seed % 2 === 0 ? 10 : 1).toFixed(2)}</span>
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
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            {stock.companyName} is primarily involved in the core operations related to the {cleanSymbol.includes('BANK') ? 'Banking and Financial' : 'Technology and Manufacturing'} sector. It has established a strong domestic presence and continues to expand its footprint in international markets.
          </p>
          <h3 className="text-sm font-bold text-foreground mb-2">KEY POINTS</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2 font-medium">Business Segments</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            1) Core Operations (62% vs 59% in FY23). The company has witnessed strong growth in domestic consumption.<br/>
            2) Exports & Global Sales (38% vs 41% in FY23).
          </p>
          <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-4">READ MORE &gt;</button>
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
          <ComposedChart data={stock.historical}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })} minTickGap={30} />
            <YAxis yAxisId="price" orientation="right" tick={{ fill: '#71717a', fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v) => `₹${v.toFixed(0)}`} />
            <YAxis yAxisId="vol" orientation="left" hide />
            <RechartsTooltip 
              contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              formatter={(value: any, name: any) => [name === 'Volume' ? (value / 1000).toFixed(0) + 'k' : `₹${Number(value).toFixed(2)}`, name === 'close' ? 'Price' : name]}
            />
            <Bar yAxisId="vol" dataKey="volume" fill="#4f46e5" opacity={0.3} maxBarSize={10} />
            <Area yAxisId="price" type="monotone" dataKey="close" stroke="#818cf8" strokeWidth={2} fillOpacity={0} />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked readOnly className="accent-indigo-500" /> Price on NSE
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" className="accent-indigo-500" /> 50 DMA
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" className="accent-indigo-500" /> 200 DMA
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked readOnly className="accent-indigo-500" /> Volume
          </label>
        </div>
      </div>

      {/* Financial Tables */}
      <TableSection title="Quarterly Results" data={quarterlyResults} cols={['Mar 2023', 'Jun 2023', 'Sep 2023', 'Dec 2023', 'Mar 2024']} />
      <TableSection title="Profit & Loss" data={profitAndLoss} cols={['Mar 2020', 'Mar 2021', 'Mar 2022', 'Mar 2023', 'Mar 2024']} />
      <TableSection title="Balance Sheet" data={balanceSheet} cols={['Mar 2020', 'Mar 2021', 'Mar 2022', 'Mar 2023', 'Mar 2024']} />

      {/* Recent News */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent News</h2>
        <div className="space-y-4">
          <div className="border-b border-white/5 pb-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1 block">2 Hours Ago • Business Standard</span>
            <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 leading-snug">{stock.companyName} signs major strategic partnership to expand footprint in emerging markets</a>
          </div>
          <div className="border-b border-white/5 pb-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1 block">1 Day Ago • Mint</span>
            <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 leading-snug">Q4 Earnings Preview: {cleanSymbol} expected to report strong double-digit revenue growth</a>
          </div>
          <div className="pb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1 block">3 Days Ago • Economic Times</span>
            <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 leading-snug">Promoters of {stock.companyName} increase stake by 1.5% through open market purchases</a>
          </div>
        </div>
      </motion.div>

    </div>
  );
}

