'use client';
import { create } from 'zustand';
import { TimePeriod, BreakdownView } from '@/types';

interface AppState {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  chartPeriod: TimePeriod;
  setChartPeriod: (period: TimePeriod) => void;
  breakdownView: BreakdownView;
  setBreakdownView: (view: BreakdownView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  selectedWatchlist: string;
  setSelectedWatchlist: (id: string) => void;
  notifications: { id: string; message: string; type: string; time: Date }[];
  addNotification: (message: string, type: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoggedIn: false,
  setIsLoggedIn: (v) => set({ isLoggedIn: v }),
  isOnboarded: false,
  setIsOnboarded: (v) => set({ isOnboarded: v }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  chartPeriod: '1Y',
  setChartPeriod: (period) => set({ chartPeriod: period }),
  breakdownView: 'sector',
  setBreakdownView: (view) => set({ breakdownView: view }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  selectedWatchlist: 'default',
  setSelectedWatchlist: (id) => set({ selectedWatchlist: id }),
  notifications: [],
  addNotification: (message, type) =>
    set((s) => ({
      notifications: [{ id: Date.now().toString(), message, type, time: new Date() }, ...s.notifications].slice(0, 50),
    })),
}));
