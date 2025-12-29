import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/dealer/listings/[id]/publish
 * 
 * Publish a listing (draft → active)
 * 
 * Security:
 * - Must be authenticated
 * - Must be a dealer
 * - Must own the listing (via dealership_id)
 * - Dealership must be active + enabled
 * - Listing must be in draft or unpublished state
 * 
 * Validation:
 * - Required fields must be complete
 * - At least one image required
 * - Marketplace mode must be assigned
 * 
 * Request Body:
 * - marketplaceMode: 'carly_verified' | 'the_hub' | 'builders_market' (required)
 * - roadReadinessState: same as marketplaceMode (required)
 * - running: boolean (optional, default: null)
 * - inspectionUploaded: boolean (optional, default: false)
 * - issueSeverity: 'minor' | 'moderate' | 'major' | 'critical' (optional for non-carly_verified)
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
    
    // Verify dealership is active and enabled
    const { data: dealership } = await supabase
      .from('dealerships')
      .select('lifecycle_status, operational_status')
      .eq('id', profile.dealership_id)
      .single();
    
    if (!dealership || dealership.lifecycle_status !== 'active' || dealership.operational_status !== 'enabled') {
      return NextResponse.json({ 
        error: 'Dealership not active - cannot publish listings', 
        lifecycle_status: dealership?.lifecycle_status,
        operational_status: dealership?.operational_status
      }, { status: 403 });
    }

    const listingId = params.id;

    // Get listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('dealership_id', profile.dealership_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ 
        error: 'Listing not found or access denied' 
      }, { status: 404 });
    }

    // Check if already published
    if (listing.status === 'active') {
      return NextResponse.json({ 
        error: 'Listing is already published' 
      }, { status: 400 });
    }

    // Validate required fields
    const missingFields = [];
    if (!listing.year) missingFields.push('year');
    if (!listing.make) missingFields.push('make');
    if (!listing.model) missingFields.push('model');
    if (!listing.price) missingFields.push('price');
    if (listing.mileage === null || listing.mileage === undefined) missingFields.push('mileage');
    if (!listing.images || listing.images.length === 0) missingFields.push('images');

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot publish: missing required fields',
        missingFields 
      }, { status: 400 });
    }

    const body = await request.json();
    const { marketplaceMode, roadReadinessState, running, inspectionUploaded, issueSeverity } = body;

    if (!marketplaceMode || !roadReadinessState) {
      return NextResponse.json({ 
        error: 'Cannot publish: marketplace mode and road readiness state required' 
      }, { status: 400 });
    }

    const validModes = ['carly_verified', 'the_hub', 'builders_market'];
    if (!validModes.includes(marketplaceMode)) {
      return NextResponse.json({ 
        error: 'Invalid marketplace mode. Must be: carly_verified, the_hub, or builders_market' 
      }, { status: 400 });
    }

    // Publish listing
    const { data: publishedListing, error: publishError } = await supabase
      .from('listings')
      .update({
        status: 'active',
        marketplace_mode: marketplaceMode,
        road_readiness_state: roadReadinessState,
        assigned_marketplace_mode: marketplaceMode,
        assigned_road_readiness_state: roadReadinessState,
        running: running !== undefined ? running : listing.running,
        inspection_uploaded: inspectionUploaded !== undefined ? inspectionUploaded : listing.inspection_uploaded,
        issue_severity: issueSeverity || listing.issue_severity,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('dealership_id', profile.dealership_id)
      .select()
      .single();

    if (publishError) {
      console.error('[LISTINGS PUBLISH] Error publishing listing:', publishError);
      return NextResponse.json({ error: publishError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      listing: publishedListing 
    });
  } catch (error) {
    console.error('[LISTINGS PUBLISH] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
