import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/alerts/check — Evaluate all active alerts against live prices
export async function GET() {
  try {
    // Fetch all active, non-triggered alerts that have a symbol and targetValue
    const alerts = await prisma.alert.findMany({
      where: {
        isActive: true,
        triggered: false,
        symbol: { not: null },
        targetValue: { not: null },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (alerts.length === 0) {
      return NextResponse.json({ checked: 0, triggered: [] });
    }

    // Deduplicate symbols to minimize API calls
    const symbolSet = new Set<string>();
    for (const a of alerts) {
      if (a.symbol) symbolSet.add(a.symbol);
    }
    const symbols = Array.from(symbolSet);

    // Fetch live prices from Yahoo Finance for all unique symbols
    const priceMap: Record<string, number> = {};
    
    // Batch symbols into groups of 10 for the quote API
    for (let i = 0; i < symbols.length; i += 10) {
      const batch = symbols.slice(i, i + 10);
      const yahooSymbols = batch.map(s => 
        (s.includes('.') || s.startsWith('^')) ? s : `${s}.NS`
      ).join(',');
      
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const data = await res.json();
          const results = data.quoteResponse?.result || [];
          for (const q of results) {
            // Map back to clean symbol
            const cleanSym = q.symbol?.replace('.NS', '').replace('.BO', '') || '';
            priceMap[cleanSym] = q.regularMarketPrice ?? 0;
            // Also store with original symbol for exact match
            priceMap[q.symbol] = q.regularMarketPrice ?? 0;
          }
        }
      } catch (err) {
        console.error('Price fetch error for batch:', batch, err);
      }
    }

    const triggered: any[] = [];

    for (const alert of alerts) {
      const sym = alert.symbol!;
      const price = priceMap[sym] ?? priceMap[`${sym}.NS`] ?? null;
      
      if (price === null || price === 0) continue; // Skip if price unavailable
      
      const target = alert.targetValue!;
      let conditionMet = false;

      switch (alert.type) {
        case 'PRICE_ABOVE':
          conditionMet = price >= target;
          break;
        case 'PRICE_BELOW':
          conditionMet = price <= target;
          break;
        case 'PERCENT_CHANGE':
          // Would need previous close for this — skip for now
          break;
        case 'WEEK52_HIGH':
        case 'WEEK52_LOW':
          // Would need 52w data — skip for now
          break;
        default:
          break;
      }

      // Check cooldown — don't re-trigger within cooldown period
      if (conditionMet && alert.lastNotifiedAt) {
        const cooldownMs = (alert.cooldownMinutes || 60) * 60 * 1000;
        const elapsed = Date.now() - new Date(alert.lastNotifiedAt).getTime();
        if (elapsed < cooldownMs) conditionMet = false;
      }

      if (conditionMet) {
        // Update alert as triggered
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            triggeredAt: new Date(),
            triggeredCount: { increment: 1 },
            lastNotifiedAt: new Date(),
            lastCheckedAt: new Date(),
          },
        });

        // Log to history
        await prisma.alertHistory.create({
          data: {
            alertId: alert.id,
            triggerValue: price,
            message: `${alert.symbol} reached ₹${price.toFixed(2)} (target: ₹${target})`,
            deliveryStatus: { inApp: 'sent' },
          },
        });

        triggered.push({
          id: alert.id,
          symbol: alert.symbol,
          type: alert.type,
          targetValue: target,
          currentPrice: price,
          message: `${alert.symbol} reached ₹${price.toFixed(2)}`,
        });
      } else {
        // Update lastCheckedAt
        await prisma.alert.update({
          where: { id: alert.id },
          data: { lastCheckedAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      checked: alerts.length,
      triggered,
      prices: priceMap,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Alert check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
