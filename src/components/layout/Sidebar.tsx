'use client';
import React from 'react';
import { useAppStore } from '@/lib/store';
import { LayoutDashboard, Briefcase, Eye, ArrowLeftRight, Receipt, TrendingUp, BarChart3, Newspaper, BookOpen, Settings, Bell, Search, CandlestickChart, PieChart, Calculator, Landmark, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'watchlist', label: 'Watchlist', icon: Eye },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'market', label: 'Market', icon: TrendingUp },
  { id: 'screener', label: 'Screener', icon: CandlestickChart },
  { id: 'mutual-funds', label: 'Mutual Funds', icon: PieChart },
  { id: 'dividends', label: 'Dividends', icon: Receipt },
  { id: 'tax', label: 'Tax & Gains', icon: Calculator },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'compare', label: 'Compare', icon: BarChart3 },
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, activePage, setActivePage } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col border-r border-border bg-[#0a0a0d] transition-all duration-300 ${sidebarOpen ? 'w-[240px]' : 'w-[68px]'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-lg font-bold gradient-text tracking-tight">ClariFi</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`nav-link w-full ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-2 border-t border-border flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
