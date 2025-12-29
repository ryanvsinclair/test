import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketplace/listings/[id]
 * 
 * Public listing detail
 * 
 * Security:
 * - Public endpoint (no auth required)
 * - Uses public_listings view
 * - Increments view_count on main listings table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    const supabase = createClient();
    
    // Get listing from materialized view
    const { data: listing, error } = await supabase
      .from('public_listings')
      .select('*')
      .eq('id', listingId)
      .single();
    
    if (error || !listing) {
      return NextResponse.json({ 
        error: 'Listing not found or not available' 
      }, { status: 404 });
    }
    
    // Increment view count (on main table, not materialized view)
    // This happens asynchronously and doesn't block the response
    supabase
      .from('listings')
      .update({ 
        view_count: (listing.view_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .then(() => {
        // Trigger materialized view refresh if needed
        // View will auto-refresh on next query due to trigger
      })
      .catch((err) => {
        console.error('[MARKETPLACE] Error incrementing view count:', err);
      });
    
    return NextResponse.json({ listing });
  } catch (error) {
    console.error('[MARKETPLACE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
