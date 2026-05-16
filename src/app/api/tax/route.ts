import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/tax - Get capital gains and tax summary
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fy = searchParams.get('fy') || getCurrentFY();

    const capitalGains = await prisma.capitalGain.findMany({
      where: { userId: session.user.id, financialYear: fy },
      orderBy: { sellDate: 'desc' },
    });

    const dividends = await prisma.dividend.findMany({
      where: { userId: session.user.id, financialYear: fy },
      orderBy: { exDate: 'desc' },
    });

    // Calculate tax summary
    const stcgGains = capitalGains.filter((g) => g.type === 'STCG');
    const ltcgGains = capitalGains.filter((g) => g.type === 'LTCG');

    const totalSTCG = stcgGains.reduce((s, g) => s + g.gain, 0);
    const totalLTCG = ltcgGains.reduce((s, g) => s + g.gain, 0);

    const stcgTax = Math.max(0, totalSTCG) * 0.20; // 20% STCG
    const ltcgExemption = 125000; // ₹1.25L exemption
    const ltcgTaxable = Math.max(0, totalLTCG - ltcgExemption);
    const ltcgTax = ltcgTaxable * 0.125; // 12.5% LTCG

    const totalDividend = dividends.reduce((s, d) => s + d.totalDividend, 0);
    const totalTDS = dividends.reduce((s, d) => s + d.tdsDeducted, 0);

    // Tax harvesting opportunities (unrealized losses)
    const holdings = await prisma.holding.findMany({
      where: { userId: session.user.id, pnl: { lt: 0 } },
      orderBy: { pnl: 'asc' },
    });

    const harvestingOpportunities = holdings.map((h) => ({
      symbol: h.symbol,
      companyName: h.companyName,
      quantity: h.quantity,
      averagePrice: h.averagePrice,
      currentPrice: h.currentPrice,
      unrealizedLoss: h.pnl,
      potentialTaxSaving: Math.abs(h.pnl) * 0.20,
    }));

    return NextResponse.json({
      financialYear: fy,
      capitalGains,
      dividends,
      summary: {
        totalSTCG,
        totalLTCG,
        stcgTax,
        ltcgTax,
        ltcgExemption,
        ltcgExemptionUsed: Math.min(totalLTCG, ltcgExemption),
        totalTaxPayable: stcgTax + ltcgTax,
        totalDividend,
        totalTDS,
        netDividend: totalDividend - totalTDS,
      },
      harvestingOpportunities,
    });
  } catch (error) {
    console.error('Failed to fetch tax data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getCurrentFY(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 3) return `FY ${year}-${(year + 1).toString().slice(2)}`;
  return `FY ${year - 1}-${year.toString().slice(2)}`;
}
