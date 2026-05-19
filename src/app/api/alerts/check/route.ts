import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/alerts/check — Evaluate all active alerts against live prices
export async function GET() {
  try {
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

    // Deduplicate symbols
    const symbolSet = new Set<string>();
    for (const a of alerts) {
      if (a.symbol) symbolSet.add(a.symbol);
    }
    const symbols = Array.from(symbolSet);

    // Fetch live prices using Yahoo Finance v8 chart API
    // Use random query param to bust any edge/CDN caches
    const priceMap: Record<string, number> = {};
    const cacheBuster = Date.now();

    await Promise.all(symbols.map(async (sym) => {
      const yahooSym = (sym.includes('.') || sym.startsWith('^')) ? sym : `${sym}.NS`;
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?range=1d&interval=1m&_=${cacheBuster}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const meta = data.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) {
            priceMap[sym] = meta.regularMarketPrice;
            priceMap[yahooSym] = meta.regularMarketPrice;
          }
        }
      } catch (err) {
        console.error('Price fetch error for', sym, err);
      }
    }));

    const triggered: any[] = [];

    for (const alert of alerts) {
      const sym = alert.symbol!;
      const price = priceMap[sym] ?? priceMap[`${sym}.NS`] ?? null;

      if (price === null || price === 0) {
        console.log(`[ALERT CHECK] No price for ${sym}, skipping`);
        continue;
      }

      const target = alert.targetValue!;
      let conditionMet = false;

      console.log(`[ALERT CHECK] ${sym}: price=${price}, target=${target}, type=${alert.type}`);

      switch (alert.type) {
        case 'PRICE_ABOVE':
          // Use small epsilon for floating point safety
          conditionMet = price >= target - 0.01;
          break;
        case 'PRICE_BELOW':
          conditionMet = price <= target + 0.01;
          break;
        case 'PERCENT_CHANGE':
          break;
        case 'WEEK52_HIGH':
        case 'WEEK52_LOW':
          break;
        default:
          break;
      }

      // Check cooldown
      if (conditionMet && alert.lastNotifiedAt) {
        const cooldownMs = (alert.cooldownMinutes || 60) * 60 * 1000;
        const elapsed = Date.now() - new Date(alert.lastNotifiedAt).getTime();
        if (elapsed < cooldownMs) {
          console.log(`[ALERT CHECK] ${sym}: in cooldown, skipping`);
          conditionMet = false;
        }
      }

      if (conditionMet) {
        console.log(`[ALERT CHECK] ✅ TRIGGERED: ${sym} at ₹${price} (target: ₹${target})`);

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
          message: `🔔 ${alert.symbol} reached ₹${price.toFixed(2)}`,
        });
      } else {
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
