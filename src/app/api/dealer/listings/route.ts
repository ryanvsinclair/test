import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DEALER LISTINGS API
 * 
 * Dealership-scoped listings management
 * All queries enforce dealership_id from profiles table
 * 
 * Security:
 * - Server-side auth validation via Supabase
 * - Role must be 'dealer'
 * - Dealership ID from profiles.dealership_id
 * - All queries scoped to dealership
 * - RLS enforces boundaries
 */

export interface DealerListing {
  id: string;
  dealershipId: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  images: string[];
  primaryImageUrl?: string;
  status: 'draft' | 'active' | 'sold' | 'deleted';
  marketplaceMode?: string;
  roadReadinessState?: string;
  viewCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ListingsResponse {
  listings: DealerListing[];
  counts: {
    active: number;
    draft: number;
    sold: number;
    total: number;
  };
}

/**
 * GET /api/dealer/listings
 * 
 * Returns listings scoped to authenticated dealer's dealership
 * 
 * Query Parameters:
 * - status: 'active' | 'draft' | 'sold' | 'all' (default: 'all')
 * - sortBy: 'updated_at' | 'created_at' | 'price' | 'mileage' | 'view_count' (default: 'updated_at')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * 
 * Security:
 * - Validates role='dealer'
 * - Validates profiles.dealership_id exists
 * - All queries scoped to dealership_id
 * - RLS policies enforce boundaries
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get profile with dealership_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, dealership_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
    }
    
    if (profile.role !== 'dealer') {
      return NextResponse.json({ error: 'Forbidden: Dealer access required' }, { status: 403 });
    }
    
    if (!profile.dealership_id) {
      return NextResponse.json({ error: 'Forbidden: No dealership linked' }, { status: 403 });
    }
    
    // Verify dealership is active and enabled
    const { data: dealership } = await supabase
      .from('dealerships')
      .select('lifecycle_status, operational_status')
      .eq('id', profile.dealership_id)
      .single();
    
    if (!dealership || dealership.lifecycle_status !== 'active' || dealership.operational_status !== 'enabled') {
      return NextResponse.json({ 
        error: 'Dealership not active', 
        lifecycle_status: dealership?.lifecycle_status,
        operational_status: dealership?.operational_status
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'updated_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build query
    let query = supabase
      .from('listings')
      .select('*')
      .eq('dealership_id', profile.dealership_id);

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Sort
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: listings, error: listingsError } = await query;

    if (listingsError) {
      console.error('[DEALER LISTINGS] Error fetching listings:', listingsError);
      return NextResponse.json({ error: listingsError.message }, { status: 500 });
    }

    // Get counts (scoped to dealership)
    const { data: countsData } = await supabase
      .from('listings')
      .select('status')
      .eq('dealership_id', profile.dealership_id);

    const counts = {
      active: countsData?.filter(l => l.status === 'active').length || 0,
      draft: countsData?.filter(l => l.status === 'draft').length || 0,
      sold: countsData?.filter(l => l.status === 'sold').length || 0,
      total: countsData?.length || 0,
    };

    // Map to response format
    const mappedListings: DealerListing[] = (listings || []).map(listing => ({
      id: listing.id,
      dealershipId: listing.dealership_id,
      vin: listing.vin,
      year: listing.year,
      make: listing.make,
      model: listing.model,
      trim: listing.trim,
      price: listing.price,
      mileage: listing.mileage,
      images: listing.images || [],
      primaryImageUrl: listing.primary_image_url,
      status: listing.status,
      marketplaceMode: listing.marketplace_mode,
      roadReadinessState: listing.road_readiness_state,
      viewCount: listing.view_count || 0,
      inquiryCount: listing.inquiry_count || 0,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      publishedAt: listing.published_at,
    }));

    return NextResponse.json({
      listings: mappedListings,
      counts,
    });
  } catch (error) {
    console.error('[DEALER LISTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dealer/listings
 * 
 * Update listing status or attributes
 * 
 * Request Body:
 * - listingId: string (required)
 * - status?: 'draft' | 'active' | 'sold' | 'deleted'
 * - price?: number
 * - mileage?: number
 * 
 * Security:
 * - Validates role='dealer'
 * - Validates profiles.dealership_id exists
 * - Updates scoped to dealership_id
 * - RLS enforces boundaries
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get profile with dealership_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, dealership_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
    }
    
    if (profile.role !== 'dealer') {
      return NextResponse.json({ error: 'Forbidden: Dealer access required' }, { status: 403 });
    }
    
    if (!profile.dealership_id) {
      return NextResponse.json({ error: 'Forbidden: No dealership linked' }, { status: 403 });
    }

    const body = await req.json();
    const { listingId, status, price, mileage } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
      if (status === 'active' && !updates.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }
    if (price !== undefined) updates.price = price;
    if (mileage !== undefined) updates.mileage = mileage;

    // Update listing (RLS enforces dealership_id scoping)
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .eq('dealership_id', profile.dealership_id)
      .select()
      .single();

    if (updateError) {
      console.error('[DEALER LISTINGS] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updatedListing) {
      return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error) {
    console.error('[DEALER LISTINGS] Unexpected update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
