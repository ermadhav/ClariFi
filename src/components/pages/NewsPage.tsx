'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockNews } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import { Bookmark, ExternalLink, Filter, Search, TrendingUp, Newspaper } from 'lucide-react';

export default function NewsPage() {
  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [sentiment, setSentiment] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [search, setSearch] = useState('');

  const filtered = mockNews.filter((n) => {
    if (sentiment !== 'all' && n.sentiment !== sentiment) return false;
    if (search && !n.headline.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          <button onClick={() => setTab('my')} className={`tab-button ${tab === 'my' ? 'active' : ''}`}>My Stocks</button>
          <button onClick={() => setTab('all')} className={`tab-button ${tab === 'all' ? 'active' : ''}`}>All Market</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            {(['all', 'positive', 'negative', 'neutral'] as const).map((s) => (
              <button key={s} onClick={() => setSentiment(s)} className={`tab-button text-xs ${sentiment === s ? 'active' : ''}`}>
                {s === 'all' ? 'All' : s === 'positive' ? '🟢' : s === 'negative' ? '🔴' : '⚪'} {s !== 'all' ? s.charAt(0).toUpperCase() + s.slice(1) : ''}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news..." className="input-field pl-9 py-1.5 text-xs w-40" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-5 cursor-pointer group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${n.sentiment === 'positive' ? 'badge-profit' : n.sentiment === 'negative' ? 'badge-loss' : 'badge-neutral'}`}>
                    {n.sentiment === 'positive' ? '🟢 Positive' : n.sentiment === 'negative' ? '🔴 Negative' : '⚪ Neutral'}
                  </span>
                  {n.relatedStocks.map((s) => <span key={s} className="badge badge-info">{s}</span>)}
                </div>
                <h3 className="text-sm font-medium text-foreground group-hover:text-indigo-400 transition-colors leading-snug">{n.headline}</h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{n.snippet}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="font-medium">{n.source}</span>
                  <span>·</span>
                  <span>{timeAgo(n.timestamp)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button className="p-1.5 rounded-lg hover:bg-white/5"><Bookmark className={`w-3.5 h-3.5 ${n.bookmarked ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} /></button>
                <button className="p-1.5 rounded-lg hover:bg-white/5"><ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
