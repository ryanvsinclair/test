import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/buyer/saved-listings
 * 
 * Get all saved listings for a buyer
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * 
 * Security:
 * - Must be authenticated
 * - RLS enforces user ownership
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Get saved listings (RLS enforces user ownership)
    const { data: savedListings, error, count } = await supabase
      .from('saved_listings')
      .select(`
        *,
        listing:listings(
          id,
          year,
          make,
          model,
          trim,
          price,
          mileage,
          primary_image_url,
          status,
          marketplace_mode,
          view_count,
          inquiry_count
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('[SAVED LISTINGS] Error fetching saved listings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      savedListings: savedListings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[SAVED LISTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/buyer/saved-listings
 * 
 * Save a listing
 * 
 * Request Body:
 * - listingId: string (required)
 * - notes: string (optional)
 * 
 * Security:
 * - Must be authenticated
 * - RLS enforces user ownership
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { listingId, notes } = body;
    
    if (!listingId) {
      return NextResponse.json(
        { error: 'Missing required field: listingId' },
        { status: 400 }
      );
    }
    
    // Verify listing exists in public_listings
    const { data: listing, error: listingError } = await supabase
      .from('public_listings')
      .select('id')
      .eq('id', listingId)
      .single();
    
    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Save listing (RLS enforces user ownership)
    const { data: savedListing, error: saveError } = await supabase
      .from('saved_listings')
      .insert({
        user_id: session.user.id,
        listing_id: listingId,
        notes: notes || null,
      })
      .select()
      .single();
    
    if (saveError) {
      // Check if already saved
      if (saveError.code === '23505') {
        return NextResponse.json(
          { error: 'Listing already saved' },
          { status: 409 }
        );
      }
      console.error('[SAVED LISTINGS] Error saving listing:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }
    
    // Track analytics event
    fetch(new URL('/api/analytics/track', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        eventType: 'save',
      }),
    }).catch((err) => console.error('[SAVED LISTINGS] Analytics error:', err));
    
    return NextResponse.json({ 
      success: true, 
      savedListing 
    }, { status: 201 });
  } catch (error) {
    console.error('[SAVED LISTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
