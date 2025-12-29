import { NextRequest, NextResponse } from 'next/server';
// Mock data removed - connect to real database

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Database Integration Placeholder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TODO: Connect to real database
// When Prisma is reintroduced:
// 1. Uncomment: import { PrismaClient } from '@prisma/client';
// 2. Initialize: const prisma = new PrismaClient();
// 3. Replace TODO comments with actual database queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface InsightsQuery {
  dealerId: string;
  startDate?: string;
  endDate?: string;
  preset?: '7d' | '30d' | '60d' | '90d' | 'ytd' | 'lifetime';
}

interface ListingInsight {
  listingId: string;
  title?: string;
  price?: number;
  views: number;
  saves: number;
  messages: number;
  engagementScore: number;
  priceSignal?: 'at' | 'below' | 'above';
  trend?: {
    views: number;
    saves: number;
    messages: number;
  };
}

/**
 * Calculate simple engagement score
 * Formula: (saves * 10) + (messages * 20) + (views * 1)
 */
function calculateEngagementScore(
  views: number,
  saves: number,
  messages: number
): number {
  return saves * 10 + messages * 20 + views;
}

/**
 * Calculate date range based on preset or custom dates
 */
function calculateDateRange(
  preset?: string,
  startDateStr?: string,
  endDateStr?: string
): { startDate: Date | null; endDate: Date; daysInRange: number } {
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  // Custom range
  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return { startDate: start, endDate: end, daysInRange: days };
    }
  }

  // Preset ranges
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  switch (preset) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      return { startDate, endDate, daysInRange: 7 };
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      return { startDate, endDate, daysInRange: 30 };
    case '60d':
      startDate.setDate(startDate.getDate() - 60);
      return { startDate, endDate, daysInRange: 60 };
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      return { startDate, endDate, daysInRange: 90 };
    case 'ytd':
      startDate.setMonth(0, 1);
      const ytdDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return { startDate, endDate, daysInRange: ytdDays };
    case 'lifetime':
    default:
      // Lifetime: no start date filter
      return { startDate: null, endDate, daysInRange: -1 };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');
    const preset = searchParams.get('preset') as '7d' | '30d' | '60d' | '90d' | 'ytd' | 'lifetime' | undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!dealerId) {
      return NextResponse.json(
        { error: 'Missing dealerId parameter' },
        { status: 400 }
      );
    }

    const { startDate, endDate, daysInRange } = calculateDateRange(preset, startDateStr, endDateStr);

    // For trend comparison (previous period, only if not lifetime)
    let trendStartDate: Date | null = null;
    if (startDate && daysInRange > 0) {
      trendStartDate = new Date(startDate);
      trendStartDate.setDate(trendStartDate.getDate() - daysInRange);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: Replace with actual Prisma queries
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // const currentMetrics = await prisma.listingMetricsDaily.findMany({
    //   where: {
    //     dealerId,
    //     date: startDate
    //       ? { gte: startDate, lte: endDate }
    //       : { lte: endDate },
    //   },
    // });
    // const previousMetrics = trendStartDate && startDate
    //   ? await prisma.listingMetricsDaily.findMany({
    //       where: {
    //         dealerId,
    //         date: { gte: trendStartDate, lt: startDate },
    //       },
    //     })
    //   : [];
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // TODO: Connect to real database
    return NextResponse.json({
      listings: [],
      totals: {
        views: 0,
        saves: 0,
        messages: 0,
        listingCount: 0,
      },
      range: {
        preset: preset || 'lifetime',
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate.toISOString(),
        days: daysInRange,
      },
    });
  } catch (error) {
    console.error('[Dealer Insights API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
