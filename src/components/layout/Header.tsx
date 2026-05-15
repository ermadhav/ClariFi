'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Search, Bell, Command, User, Wifi, ChevronDown } from 'lucide-react';
import { mockIndices } from '@/lib/mock-data';

export default function Header() {
  const { sidebarOpen, setCommandPaletteOpen, activePage } = useAppStore();
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    setIsMarketOpen(day >= 1 && day <= 5 && hours >= 9 && hours < 16);
  }, []);

  const pageTitle: Record<string, string> = {
    dashboard: 'Dashboard',
    portfolio: 'Portfolio Breakdown',
    watchlist: 'Watchlist',
    transactions: 'Transactions',
    market: 'Market Overview',
    screener: 'Stock Screener',
    'mutual-funds': 'Mutual Funds',
    dividends: 'Dividends',
    tax: 'Tax & Capital Gains',
    news: 'News & Insights',
    alerts: 'Alerts',
    compare: 'Compare',
    learn: 'Learn',
    settings: 'Settings',
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 border-b border-border bg-[#0a0a0d]/80 backdrop-blur-xl flex items-center justify-between px-6 transition-all duration-300 ${sidebarOpen ? 'left-[240px]' : 'left-[68px]'}`}
    >
      {/* Left: Market Ticker */}
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold text-foreground">{pageTitle[activePage] || 'Dashboard'}</h1>
        <div className="hidden lg:flex items-center gap-4 ml-4">
          {mockIndices.slice(0, 3).map((idx) => (
            <div key={idx.name} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">{idx.name}</span>
              <span className="text-foreground font-semibold">{idx.value.toLocaleString('en-IN')}</span>
              <span className={idx.change >= 0 ? 'text-profit' : 'text-loss'}>
                {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.changePercent).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Market Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-xs">
          <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-profit animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-muted-foreground">{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
        </div>

        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-sm hover:bg-white/8 hover:border-white/15 transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Search...</span>
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
