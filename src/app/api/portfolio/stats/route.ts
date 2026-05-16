import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/portfolio/stats - Full portfolio analytics
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const holdings = await prisma.holding.findMany({
      where: { userId: session.user.id },
    });

    if (holdings.length === 0) {
      return NextResponse.json({ hasData: false, stats: null });
    }

    const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
    const totalInvested = holdings.reduce((s, h) => s + h.totalInvested, 0);
    const totalPnl = totalValue - totalInvested;
    const dayPnl = holdings.reduce((s, h) => s + h.dayChange * h.quantity, 0);

    // Sector breakdown
    const sectorMap: Record<string, { value: number; pnl: number; count: number }> = {};
    holdings.forEach((h) => {
      if (!sectorMap[h.sector]) sectorMap[h.sector] = { value: 0, pnl: 0, count: 0 };
      sectorMap[h.sector].value += h.currentValue;
      sectorMap[h.sector].pnl += h.pnl;
      sectorMap[h.sector].count++;
    });

    const sectorBreakdown = Object.entries(sectorMap).map(([name, data]) => ({
      name,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      pnl: data.pnl,
      count: data.count,
    })).sort((a, b) => b.value - a.value);

    // Market cap breakdown
    const capMap: Record<string, number> = {};
    holdings.forEach((h) => {
      const cap = h.marketCap.replace('_', ' ');
      capMap[cap] = (capMap[cap] || 0) + h.currentValue;
    });

    // Top performers
    const topGainers = [...holdings].sort((a, b) => b.pnlPercent - a.pnlPercent).slice(0, 5);
    const topLosers = [...holdings].sort((a, b) => a.pnlPercent - b.pnlPercent).slice(0, 5);

    // Portfolio health
    const concentrationRisk = Math.max(...holdings.map((h) => (h.currentValue / totalValue) * 100));
    const sectorCount = Object.keys(sectorMap).length;
    const diversificationScore = Math.min(100, sectorCount * 12 + (concentrationRisk < 20 ? 20 : 0));

    // Best performer
    const bestPerformer = holdings.reduce((best, h) => h.pnlPercent > best.pnlPercent ? h : best, holdings[0]);

    return NextResponse.json({
      hasData: true,
      stats: {
        totalValue,
        totalInvested,
        totalPnl,
        totalPnlPercent: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
        dayPnl,
        dayPnlPercent: totalValue > 0 ? (dayPnl / totalValue) * 100 : 0,
        holdingCount: holdings.length,
        sectorBreakdown,
        marketCapBreakdown: capMap,
        topGainers: topGainers.map((h) => ({ symbol: h.symbol, companyName: h.companyName, pnlPercent: h.pnlPercent })),
        topLosers: topLosers.map((h) => ({ symbol: h.symbol, companyName: h.companyName, pnlPercent: h.pnlPercent })),
        concentrationRisk,
        diversificationScore,
        bestPerformer: { symbol: bestPerformer.symbol, pnlPercent: bestPerformer.pnlPercent },
      },
    });
  } catch (error) {
    console.error('Failed to fetch portfolio stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
