'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Search, Bell, Command, User, Wifi, ChevronDown } from 'lucide-react';
import { mockIndices } from '@/lib/mock-data';

export default function Header() {
  const { sidebarOpen, setCommandPaletteOpen, activePage } = useAppStore();
  const [indices, setIndices] = useState<any[]>(mockIndices.slice(0, 3));
  const [marketStatus, setMarketStatus] = useState('Closed');
  const [marketStatusColor, setMarketStatusColor] = useState('bg-muted-foreground');

  // NSE Holidays 2025-2026 (NSE official calendar)
  const NSE_HOLIDAYS = [
    // 2025
    '2025-02-26', '2025-03-14', '2025-03-31', '2025-04-10', '2025-04-14',
    '2025-04-18', '2025-05-01', '2025-06-27', '2025-08-15', '2025-08-16', '2025-08-27',
    '2025-10-02', '2025-10-20', '2025-10-21', '2025-10-22', '2025-11-05', '2025-11-26',
    '2025-12-25',
    // 2026
    '2026-01-26', '2026-02-17', '2026-03-03', '2026-03-20', '2026-03-30',
    '2026-04-03', '2026-04-14', '2026-05-01', '2026-06-17', '2026-07-07',
    '2026-08-15', '2026-08-25', '2026-10-02', '2026-10-09', '2026-10-10',
    '2026-10-20', '2026-10-26', '2026-11-16', '2026-12-25',
  ];

  useEffect(() => {
    function getMarketStatus() {
      // All times in IST
      const now = new Date();
      const istOffset = 5.5 * 60; // IST = UTC + 5:30
      const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      const istMinutes = utcMinutes + istOffset;
      const istHour = Math.floor(istMinutes / 60) % 24;
      const istMin = istMinutes % 60;
      const totalMinutes = istHour * 60 + istMin;

      // Get IST date for holiday check
      const istDate = new Date(now.getTime() + (istOffset - now.getTimezoneOffset()) * 60000);
      const day = istDate.getDay(); // 0=Sun, 6=Sat
      const dateStr = istDate.toISOString().split('T')[0];

      // Weekend check
      if (day === 0 || day === 6) {
        return { status: 'Market Closed', color: 'bg-muted-foreground', isOpen: false };
      }

      // Holiday check
      if (NSE_HOLIDAYS.includes(dateStr)) {
        return { status: 'Holiday', color: 'bg-amber-500', isOpen: false };
      }

      // Session checks (in IST minutes from midnight)
      const PRE_OPEN_START = 9 * 60;       // 9:00 AM
      const PRE_OPEN_END = 9 * 60 + 15;    // 9:15 AM
      const REGULAR_START = 9 * 60 + 15;   // 9:15 AM
      const REGULAR_END = 15 * 60 + 30;    // 3:30 PM
      const CLOSING_END = 15 * 60 + 40;    // 3:40 PM
      const POST_CLOSE_END = 16 * 60;      // 4:00 PM

      if (totalMinutes >= PRE_OPEN_START && totalMinutes < PRE_OPEN_END) {
        return { status: 'Pre-Open', color: 'bg-amber-500 animate-pulse', isOpen: false };
      }
      if (totalMinutes >= REGULAR_START && totalMinutes < REGULAR_END) {
        return { status: 'Market Open', color: 'bg-profit animate-pulse', isOpen: true };
      }
      if (totalMinutes >= REGULAR_END && totalMinutes < CLOSING_END) {
        return { status: 'Closing Session', color: 'bg-orange-500 animate-pulse', isOpen: false };
      }
      if (totalMinutes >= CLOSING_END && totalMinutes < POST_CLOSE_END) {
        return { status: 'Post-Close', color: 'bg-orange-500', isOpen: false };
      }

      return { status: 'Market Closed', color: 'bg-muted-foreground', isOpen: false };
    }

    function updateStatus() {
      const s = getMarketStatus();
      setMarketStatus(s.status);
      setMarketStatusColor(s.color);
    }

    updateStatus();
    // Re-check every 30 seconds
    const statusInterval = setInterval(updateStatus, 30_000);

    const fetchIndices = async () => {
      try {
        const res = await fetch('/api/market/indices');
        if (res.ok) {
          const data = await res.json();
          if (data.indices) setIndices(data.indices);
        }
      } catch (e) {}
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 60000);
    return () => { clearInterval(interval); clearInterval(statusInterval); };
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
          {indices.map((idx) => (
            <div key={idx.name} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">{idx.name}</span>
              <span className="text-foreground font-semibold">{idx.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
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
          <div className={`w-1.5 h-1.5 rounded-full ${marketStatusColor}`} />
          <span className="text-muted-foreground">{marketStatus}</span>
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
