import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/dashboard/hot-listings
 * 
 * Get "hot" listings with high engagement
 * 
 * Query Parameters:
 * - days: number (default: 7)
 * - limit: number (default: 10)
 * 
 * Security:
 * - Must be authenticated
 * - Must be dealer with dealership_id
 */
export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all active listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, year, make, model, trim, price, view_count, inquiry_count, published_at')
      .eq('dealership_id', profile.dealership_id)
      .eq('status', 'active');
    
    if (!listings || listings.length === 0) {
      return NextResponse.json({ hotListings: [] });
    }
    
    const listingIds = listings.map(l => l.id);
    
    // Get recent analytics
    const { data: recentAnalytics } = await supabase
      .from('listing_analytics_daily')
      .select('listing_id, view_count, save_count, inquiry_count')
      .in('listing_id', listingIds)
      .gte('date', startDate.toISOString().split('T')[0]);
    
    // Get saves count
    const { data: saves } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .in('listing_id', listingIds)
      .gte('created_at', startDate.toISOString());
    
    // Get engagement scores
    const { data: engagementScores } = await supabase
      .from('buyer_engagement_scores')
      .select('listing_id, engagement_score, has_saved, has_inquired')
      .in('listing_id', listingIds);
    
    // Calculate metrics per listing
    const listingMetrics = listings.map(listing => {
      const recentViews = recentAnalytics
        ?.filter(a => a.listing_id === listing.id)
        .reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;
      
      const recentSaves = saves?.filter(s => s.listing_id === listing.id).length || 0;
      
      const recentInquiries = recentAnalytics
        ?.filter(a => a.listing_id === listing.id)
        .reduce((sum, a) => sum + (a.inquiry_count || 0), 0) || 0;
      
      const engagement = engagementScores?.filter(e => e.listing_id === listing.id) || [];
      const totalEngagement = engagement.reduce((sum, e) => sum + (e.engagement_score || 0), 0);
      const uniqueBuyers = engagement.length;
      const highIntentBuyers = engagement.filter(e => e.engagement_score >= 20).length;
      
      // Calculate heat score (weighted)
      const heatScore = 
        recentViews * 1 +
        recentSaves * 5 +
        recentInquiries * 10 +
        totalEngagement * 0.5;
      
      return {
        id: listing.id,
        title: `${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ''}`,
        price: listing.price,
        publishedAt: listing.published_at,
        recentViews,
        recentSaves,
        recentInquiries,
        totalEngagement,
        uniqueBuyers,
        highIntentBuyers,
        heatScore,
      };
    });
    
    // Sort by heat score and take top N
    const hotListings = listingMetrics
      .sort((a, b) => b.heatScore - a.heatScore)
      .slice(0, limit);
    
    return NextResponse.json({ hotListings });
  } catch (error) {
    console.error('[HOT LISTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
