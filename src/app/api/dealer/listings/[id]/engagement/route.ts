import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/listings/[id]/engagement
 * 
 * Get engagement signals for a listing (dealer view)
 * 
 * Security:
 * - Must be authenticated
 * - Must be dealer with dealership_id
 * - Must own listing
 */
export async function GET(
  request: NextRequest,
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
    
    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .eq('dealership_id', profile.dealership_id)
      .single();
    
    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get saves count (RLS enforces dealership scoping)
    const { count: savesCount } = await supabase
      .from('saved_listings')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);
    
    // Get engagement scores (RLS enforces dealership scoping)
    const { data: engagementScores } = await supabase
      .from('buyer_engagement_scores')
      .select('engagement_score, has_saved, has_inquired, view_count')
      .eq('listing_id', listingId);
    
    // Calculate aggregates
    const totalEngagement = engagementScores?.reduce((sum, s) => sum + (s.engagement_score || 0), 0) || 0;
    const avgEngagement = engagementScores?.length 
      ? (totalEngagement / engagementScores.length).toFixed(2) 
      : '0.00';
    
    const highEngagementBuyers = engagementScores?.filter(s => s.engagement_score >= 20).length || 0;
    
    return NextResponse.json({
      listingId,
      savesCount: savesCount || 0,
      uniqueBuyers: engagementScores?.length || 0,
      averageEngagementScore: parseFloat(avgEngagement),
      highEngagementBuyers,
      engagementDistribution: {
        saved: engagementScores?.filter(s => s.has_saved).length || 0,
        inquired: engagementScores?.filter(s => s.has_inquired).length || 0,
      },
    });
  } catch (error) {
    console.error('[DEALER LISTING ENGAGEMENT] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
