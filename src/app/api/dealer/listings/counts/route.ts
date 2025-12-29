import { NextRequest, NextResponse } from 'next/server';

/**
 * LISTINGS COUNTS API
 * 
 * Lightweight endpoint for status counts only
 * Should be CACHED in Redis for high-traffic dealerships (TTL: 60s)
 * 
 * This prevents recounting thousands of records on every page load
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Database Integration Placeholder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// When Prisma is reintroduced:
// 1. Uncomment: import { PrismaClient } from '@prisma/client';
// 2. Initialize: const prisma = new PrismaClient();
// 3. Replace stub count queries with actual database queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { error: 'Missing dealerId parameter' },
        { status: 400 }
      );
    }

    // TODO: Check Redis cache first
    // const cached = await redis.get(`dealer:${dealerId}:counts`);
    // if (cached) return NextResponse.json(JSON.parse(cached));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: Replace with actual Prisma queries
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // const [active, paused, pending, sold] = await Promise.all([
    //   prisma.listing.count({ where: { dealerId, status: 'active' } }),
    //   prisma.listing.count({ where: { dealerId, status: 'paused' } }),
    //   prisma.listing.count({ where: { dealerId, status: 'pending' } }),
    //   prisma.listing.count({ where: { dealerId, status: 'sold' } }),
    // ]);
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Stub implementation for production build
    const [active, paused, pending, sold] = [0, 0, 0, 0];

    const counts = {
      active,
      paused,
      pending,
      sold,
      total: active + paused + pending + sold,
    };

    // TODO: Cache in Redis
    // await redis.setex(`dealer:${dealerId}:counts`, 60, JSON.stringify(counts));

    return NextResponse.json(counts);
  } catch (error) {
    console.error('[Listings Counts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 }
    );
  }
}
