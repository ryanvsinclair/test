import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketplace/stats
 * 
 * Get marketplace statistics
 * 
 * Returns:
 * - Total active listings
 * - Counts by marketplace mode
 * - Average price
 * 
 * Security:
 * - Public endpoint (no auth required)
 * - Uses public_listings view
 * 
 * Caching:
 * - Consider edge caching with revalidation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get all listings (from materialized view)
    const { data: listings, count } = await supabase
      .from('public_listings')
      .select('price, marketplace_mode', { count: 'exact' });
    
    if (!listings) {
      return NextResponse.json({
        totalListings: 0,
        byMarketplaceMode: {},
        averagePrice: 0,
      });
    }
    
    // Count by marketplace mode
    const byMarketplaceMode: Record<string, number> = {};
    listings.forEach(listing => {
      if (listing.marketplace_mode) {
        byMarketplaceMode[listing.marketplace_mode] = 
          (byMarketplaceMode[listing.marketplace_mode] || 0) + 1;
      }
    });
    
    // Calculate average price
    const prices = listings.map(l => l.price).filter(Boolean);
    const averagePrice = prices.length > 0
      ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
      : 0;
    
    return NextResponse.json({
      totalListings: count || 0,
      byMarketplaceMode,
      averagePrice,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[MARKETPLACE STATS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
