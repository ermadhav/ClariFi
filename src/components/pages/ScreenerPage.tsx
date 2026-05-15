'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockHoldings } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Search, SlidersHorizontal, Save, Star, RotateCcw, Eye } from 'lucide-react';

const presets = [
  { name: 'Value Stocks', desc: 'Low PE, Low PB', filters: { peMax: 15, pbMax: 2 } },
  { name: 'High Dividend', desc: '>2% Yield', filters: { divYieldMin: 2 } },
  { name: 'Growth Stocks', desc: 'High PE, High Beta', filters: { peMin: 25 } },
  { name: 'Debt-Free', desc: 'Zero debt companies', filters: {} },
  { name: 'Large Caps', desc: 'Market Cap > ₹50K Cr', filters: { cap: 'LARGE_CAP' } },
  { name: '52W Breakout', desc: 'Near 52-week high', filters: {} },
];

export default function ScreenerPage() {
  const [peRange, setPeRange] = useState([0, 100]);
  const [divYield, setDivYield] = useState(0);
  const [capFilter, setCapFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const results = mockHoldings.filter((h) => {
    if (h.pe < peRange[0] || h.pe > peRange[1]) return false;
    if (h.dividendYield < divYield) return false;
    if (capFilter !== 'ALL' && h.marketCap !== capFilter) return false;
    if (sectorFilter !== 'ALL' && h.sector !== sectorFilter) return false;
    return true;
  });

  const sectors = [...new Set(mockHoldings.map((h) => h.sector))];

  return (
    <div className="space-y-6 animate-in">
      {/* Presets */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {presets.map((p) => (
          <button key={p.name} className="flex-shrink-0 p-3 rounded-xl glass-card glass-card-hover text-left min-w-[140px]">
            <div className="text-sm font-medium text-foreground">{p.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 space-y-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-indigo-400" /> Filters</h2>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">P/E Ratio: {peRange[0]} - {peRange[1]}</label>
            <input type="range" min="0" max="100" value={peRange[1]} onChange={(e) => setPeRange([peRange[0], +e.target.value])} className="w-full accent-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Min Dividend Yield: {divYield}%</label>
            <input type="range" min="0" max="10" step="0.5" value={divYield} onChange={(e) => setDivYield(+e.target.value)} className="w-full accent-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Market Cap</label>
            <select value={capFilter} onChange={(e) => setCapFilter(e.target.value)} className="input-field text-xs">
              <option value="ALL">All</option>
              <option value="LARGE_CAP">Large Cap</option>
              <option value="MID_CAP">Mid Cap</option>
              <option value="SMALL_CAP">Small Cap</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Sector</label>
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="input-field text-xs">
              <option value="ALL">All Sectors</option>
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-xs py-1.5 flex-1"><Save className="w-3 h-3" /> Save</button>
            <button onClick={() => { setPeRange([0, 100]); setDivYield(0); setCapFilter('ALL'); setSectorFilter('ALL'); }} className="btn-secondary text-xs py-1.5"><RotateCcw className="w-3 h-3" /></button>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="xl:col-span-3 glass-card overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{results.length} stocks found</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider border-y border-border">
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">P/E</th>
                  <th className="px-4 py-3 text-right">P/B</th>
                  <th className="px-4 py-3 text-right">Div Yield</th>
                  <th className="px-4 py-3 text-right">Beta</th>
                  <th className="px-4 py-3 text-center">Cap</th>
                  <th className="px-4 py-3 text-right">1Y Return</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((h) => (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3"><div className="font-medium text-foreground">{h.symbol}</div><div className="text-xs text-muted-foreground">{h.sector}</div></td>
                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(h.currentPrice)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{h.pe.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{h.pb.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{h.dividendYield.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{h.beta.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center"><span className="badge badge-info text-[10px]">{h.marketCap.replace('_', ' ')}</span></td>
                    <td className={`px-4 py-3 text-right font-medium ${h.pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(h.pnlPercent)}</td>
                    <td className="px-4 py-3 text-center"><button className="p-1.5 rounded-lg hover:bg-white/5"><Star className="w-3.5 h-3.5 text-muted-foreground" /></button></td>
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
