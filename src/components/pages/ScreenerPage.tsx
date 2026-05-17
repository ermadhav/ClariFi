'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Search, TrendingUp, BarChart3, ShieldCheck, Zap } from 'lucide-react';

const popularScreens = [
  { name: 'Low PE, High Growth', desc: 'Companies growing at >20% with PE < 15', icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
  { name: 'Debt Free Companies', desc: 'Zero debt with consistent profit growth', icon: <ShieldCheck className="w-5 h-5 text-blue-400" /> },
  { name: 'High Dividend Yield', desc: 'Dividend yield > 4% and stable earnings', icon: <BarChart3 className="w-5 h-5 text-indigo-400" /> },
  { name: 'FII Buying', desc: 'Stocks where FIIs increased stake recently', icon: <Zap className="w-5 h-5 text-amber-400" /> },
];

export default function ScreenerPage() {
  const { setActivePage } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStock = (symbol: string) => {
    // If it's a Screener.in path like /company/RELIANCE/consolidated/ we extract the symbol
    let cleanSymbol = symbol;
    if (symbol.includes('/company/')) {
      cleanSymbol = symbol.split('/')[2];
    }
    setActivePage(`stock-${cleanSymbol}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectStock(searchResults[0].url || searchResults[0].symbol);
    } else if (searchQuery.trim().length > 0) {
      setActivePage(`stock-${searchQuery.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in p-4">
      <div className="w-full max-w-3xl text-center space-y-8">
        
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Stock Screener</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Search and analyze Indian stocks. Find deep fundamental data, quarterly results, and balance sheets.
          </p>
        </div>

        {/* Big Search Bar */}
        <div className="relative max-w-2xl mx-auto mt-8">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 md:py-5 bg-white/5 border border-white/10 rounded-2xl leading-5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-lg shadow-xl"
              placeholder="Search for a company (e.g. Reliance, TCS, HDFC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </form>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-[#121216] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto text-left">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectStock(result.url || result.symbol)}
                  className="w-full px-5 py-3 hover:bg-white/5 flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 last:border-0 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground text-left">{result.name}</span>
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded text-left mt-1 md:mt-0">{result.url ? result.url.split('/')[2] : result.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Screens */}
        <div className="pt-16 max-w-4xl mx-auto text-left">
          <h3 className="text-sm font-semibold text-muted-foreground mb-6 text-center uppercase tracking-widest">Or explore popular screens</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularScreens.map((screen, idx) => (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={screen.name} 
                className="glass-card p-5 flex items-start gap-4 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                  {screen.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-indigo-400 transition-colors">{screen.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{screen.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
