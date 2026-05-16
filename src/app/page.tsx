'use client';
import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardPage from '@/components/pages/DashboardPage';
import PortfolioPage from '@/components/pages/PortfolioPage';
import WatchlistPage from '@/components/pages/WatchlistPage';
import TransactionsPage from '@/components/pages/TransactionsPage';
import MarketPage from '@/components/pages/MarketPage';
import ScreenerPage from '@/components/pages/ScreenerPage';
import MutualFundsPage from '@/components/pages/MutualFundsPage';
import DividendsPage from '@/components/pages/DividendsPage';
import TaxPage from '@/components/pages/TaxPage';
import NewsPage from '@/components/pages/NewsPage';
import AlertsPage from '@/components/pages/AlertsPage';
import ComparePage from '@/components/pages/ComparePage';
import LearnPage from '@/components/pages/LearnPage';
import SettingsPage from '@/components/pages/SettingsPage';
import StockDetailPage from '@/components/pages/StockDetailPage';
import LoginPage from '@/components/pages/LoginPage';
import OnboardingPage from '@/components/pages/OnboardingPage';
import SplashScreen from '@/components/ui/SplashScreen';
import ToastContainer from '@/components/ui/Toast';

function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActivePage } = useAppStore();
  const [search, setSearch] = React.useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const items = [
    { label: 'Dashboard', page: 'dashboard' },
    { label: 'Portfolio Breakdown', page: 'portfolio' },
    { label: 'Watchlist', page: 'watchlist' },
    { label: 'Transactions', page: 'transactions' },
    { label: 'Market Overview', page: 'market' },
    { label: 'Stock Screener', page: 'screener' },
    { label: 'Mutual Funds', page: 'mutual-funds' },
    { label: 'Dividends', page: 'dividends' },
    { label: 'Tax & Capital Gains', page: 'tax' },
    { label: 'News & Insights', page: 'news' },
    { label: 'Alerts', page: 'alerts' },
    { label: 'Compare Stocks', page: 'compare' },
    { label: 'Learn Investing', page: 'learn' },
    { label: 'Settings', page: 'settings' },
  ];

  const filtered = items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()));

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setCommandPaletteOpen(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 bg-[#0c0c0f] border border-border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages, stocks, actions..."
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground font-mono">ESC</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.map((item) => (
            <button
              key={item.page}
              onClick={() => { setActivePage(item.page); setCommandPaletteOpen(false); setSearch(''); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
              {item.label}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground">No results found</div>}
        </div>
      </div>
    </div>
  );
}

function PageContent() {
  const { activePage } = useAppStore();

  if (activePage.startsWith('stock-')) {
    const symbol = activePage.replace('stock-', '');
    return <StockDetailPage symbol={symbol} />;
  }

  switch (activePage) {
    case 'dashboard': return <DashboardPage />;
    case 'portfolio': return <PortfolioPage />;
    case 'watchlist': return <WatchlistPage />;
    case 'transactions': return <TransactionsPage />;
    case 'market': return <MarketPage />;
    case 'screener': return <ScreenerPage />;
    case 'mutual-funds': return <MutualFundsPage />;
    case 'dividends': return <DividendsPage />;
    case 'tax': return <TaxPage />;
    case 'news': return <NewsPage />;
    case 'alerts': return <AlertsPage />;
    case 'compare': return <ComparePage />;
    case 'learn': return <LearnPage />;
    case 'settings': return <SettingsPage />;
    default: return <DashboardPage />;
  }
}

export default function Home() {
  const { sidebarOpen, isLoggedIn, setIsLoggedIn, isOnboarded, setIsOnboarded } = useAppStore();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <AnimatePresence>
        <SplashScreen onComplete={() => setShowSplash(false)} />
      </AnimatePresence>
    );
  }

  useEffect(() => {
    // Handle OAuth redirects in SPA
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const success = url.searchParams.get('success');
      const error = url.searchParams.get('error');
      
      if (success) {
        import('@/components/ui/Toast').then(({ showToast }) => {
          showToast('Broker connected successfully!', 'success');
        });
        window.history.replaceState({}, '', '/');
      } else if (error) {
        import('@/components/ui/Toast').then(({ showToast }) => {
          showToast(`Broker connection failed: ${error}`, 'error');
        });
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <>
        <ToastContainer />
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      </>
    );
  }

  if (!isOnboarded) {
    return (
      <>
        <ToastContainer />
        <OnboardingPage onComplete={() => setIsOnboarded(true)} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <ToastContainer />
      <Sidebar />
      <Header />
      <CommandPalette />
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-[240px]' : 'ml-[68px]'}`}>
        <div className="p-6">
          <PageContent />
        </div>

        {/* Footer Disclaimer */}
        <footer className="px-6 py-4 border-t border-border/50 mt-8">
          <p className="text-[10px] text-muted-foreground/50 text-center max-w-3xl mx-auto">
            ClariFi is for informational purposes only and does not constitute investment advice. Past performance does not guarantee future results. 
            Consult a SEBI-registered financial advisor before making investment decisions. Data sourced from NSE/BSE and may be delayed.
          </p>
        </footer>
      </main>
    </div>
  );
}
