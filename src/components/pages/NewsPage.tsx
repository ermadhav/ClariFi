'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/utils';
import { Bookmark, ExternalLink, Filter, Search, TrendingUp, Newspaper, Loader2, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface NewsSection {
  id: string;
  name: string;
  stockCount: number;
  symbols: string[];
  type: string;
}

interface NewsItem {
  id: string;
  headline: string;
  snippet: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedStocks: string[];
  source: string;
  publishedAt: string;
  articleUrl: string;
  bookmarked?: boolean;
}

export default function NewsPage() {
  const [sections, setSections] = useState<NewsSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [search, setSearch] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Sections
  useEffect(() => {
    async function fetchSections() {
      try {
        const res = await fetch('/api/news/sections');
        if (res.ok) {
          const data = await res.json();
          setSections(data.sections);
          if (data.sections.length > 0) {
            setActiveSectionId(data.sections[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching sections:', err);
      }
    }
    fetchSections();
  }, []);

  // 2. Fetch News for Active Section
  const fetchNews = useCallback(async (isPolling = false) => {
    if (!activeSectionId) return;
    
    const activeSection = sections.find(s => s.id === activeSectionId);
    if (!activeSection) return;

    if (!isPolling) setLoading(true);

    try {
      const symbolsParam = activeSection.symbols.join(',');
      const res = await fetch(`/api/news/${activeSection.id}?symbols=${encodeURIComponent(symbolsParam)}&sentiment=${sentimentFilter}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [activeSectionId, sections, sentimentFilter]);

  // Initial fetch when section or sentiment changes
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // 3. Setup Polling
  useEffect(() => {
    if (isLive) {
      pollIntervalRef.current = setInterval(() => {
        fetchNews(true);
      }, 3 * 60 * 1000); // 3 minutes
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isLive, fetchNews]);

  // Filter by local search query
  const filteredNews = news.filter((n) => {
    if (search && !n.headline.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            News & Insights
            {isLive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {timeAgo(lastUpdated)}
            </span>
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${isLive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLive ? 'animate-spin-slow' : ''}`} />
              {isLive ? 'Live Updates On' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        {sections.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSectionId === section.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-[#18181b] text-muted-foreground border border-[#27272a] hover:bg-[#27272a] hover:text-foreground'
                }`}
              >
                {section.name}
                {section.stockCount !== null && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeSectionId === section.id ? 'bg-black/20 text-white' : 'bg-white/10'}`}>
                    {section.stockCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-9 w-32 bg-white/5 rounded-lg animate-pulse" />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 border border-white/5 p-2 rounded-xl">
        <div className="flex gap-1 bg-black/40 rounded-lg p-1">
          {(['all', 'positive', 'negative', 'neutral'] as const).map((s) => (
            <button key={s} onClick={() => setSentimentFilter(s)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${sentimentFilter === s ? 'bg-white/10 text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
              {s === 'all' ? 'All' : s === 'positive' ? '🟢 ' : s === 'negative' ? '🔴 ' : '⚪ '}
              {s !== 'all' ? s.charAt(0).toUpperCase() + s.slice(1) : ''}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search within section..." 
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50" 
          />
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card p-5 h-40 animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-16 h-5 bg-white/5 rounded" />
                <div className="w-16 h-5 bg-white/5 rounded" />
              </div>
              <div className="w-3/4 h-5 bg-white/10 rounded mb-2" />
              <div className="w-1/2 h-5 bg-white/10 rounded mb-4" />
              <div className="w-1/4 h-3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No News Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {search || sentimentFilter !== 'all' 
              ? "No articles match your current filters. Try adjusting them."
              : "There are no recent news articles for the stocks in this section. Check back later."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredNews.map((n, i) => (
              <motion.div 
                key={n.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }} 
                className="glass-card glass-card-hover p-5 cursor-pointer group flex flex-col justify-between"
                onClick={() => window.open(n.articleUrl, '_blank')}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      n.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {n.sentiment === 'positive' ? '🟢 Positive' : n.sentiment === 'negative' ? '🔴 Negative' : '⚪ Neutral'}
                    </span>
                    {n.relatedStocks.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                    {n.headline}
                  </h3>
                  {n.snippet && n.snippet !== n.headline && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{n.snippet}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{n.source}</span>
                    <span>·</span>
                    <span>{timeAgo(new Date(n.publishedAt))}</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white" onClick={() => window.open(n.articleUrl, '_blank')}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
