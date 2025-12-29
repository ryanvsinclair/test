import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/dealer/listings/[id]/mark-sold
 * 
 * Mark a listing as sold
 * 
 * Security:
 * - Must be authenticated
 * - Must be a dealer
 * - Must own the listing (via dealership_id)
 * - Listing must be in active state
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const listingId = params.id;

    // Get listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('status')
      .eq('id', listingId)
      .eq('dealership_id', profile.dealership_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ 
        error: 'Listing not found or access denied' 
      }, { status: 404 });
    }

    // Check if already sold
    if (listing.status === 'sold') {
      return NextResponse.json({ 
        error: 'Listing is already marked as sold' 
      }, { status: 400 });
    }

    // Mark as sold
    const { data: soldListing, error: soldError } = await supabase
      .from('listings')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('dealership_id', profile.dealership_id)
      .select()
      .single();

    if (soldError) {
      console.error('[LISTINGS MARK-SOLD] Error marking listing as sold:', soldError);
      return NextResponse.json({ error: soldError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      listing: soldListing 
    });
  } catch (error) {
    console.error('[LISTINGS MARK-SOLD] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
