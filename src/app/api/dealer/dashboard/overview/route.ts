import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/dashboard/overview
 * 
 * Unified dealer dashboard data
 * 
 * Query Parameters:
 * - days: number (default: 30)
 * 
 * Security:
 * - Must be authenticated
 * - Must be dealer with dealership_id
 * - All data scoped to dealership
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
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get listing counts
    const { data: listings } = await supabase
      .from('listings')
      .select('status')
      .eq('dealership_id', profile.dealership_id);
    
    const listingCounts = {
      active: listings?.filter(l => l.status === 'active').length || 0,
      draft: listings?.filter(l => l.status === 'draft').length || 0,
      sold: listings?.filter(l => l.status === 'sold').length || 0,
      total: listings?.length || 0,
    };
    
    // Get analytics totals
    const { data: analyticsDaily } = await supabase
      .from('dealership_analytics_daily')
      .select('*')
      .eq('dealership_id', profile.dealership_id)
      .gte('date', startDate.toISOString().split('T')[0]);
    
    const analyticsTotals = analyticsDaily?.reduce(
      (acc, day) => ({
        views: acc.views + (day.total_views || 0),
        saves: acc.saves + (day.total_saves || 0),
        inquiries: acc.inquiries + (day.total_inquiries || 0),
      }),
      { views: 0, saves: 0, inquiries: 0 }
    ) || { views: 0, saves: 0, inquiries: 0 };
    
    // Get inquiry SLA metrics
    const { data: slaDaily } = await supabase
      .from('inquiry_sla_metrics_daily')
      .select('*')
      .eq('dealership_id', profile.dealership_id)
      .gte('date', startDate.toISOString().split('T')[0]);
    
    const slaTotals = slaDaily?.reduce(
      (acc, day) => ({
        totalInquiries: acc.totalInquiries + (day.total_inquiries || 0),
        repliedInquiries: acc.repliedInquiries + (day.replied_inquiries || 0),
      }),
      { totalInquiries: 0, repliedInquiries: 0 }
    ) || { totalInquiries: 0, repliedInquiries: 0 };
    
    const avgResponseTime = slaDaily?.length
      ? slaDaily.reduce((sum, day) => sum + (day.avg_response_time_minutes || 0), 0) / slaDaily.length
      : 0;
    
    const responseRate = slaTotals.totalInquiries > 0
      ? ((slaTotals.repliedInquiries / slaTotals.totalInquiries) * 100).toFixed(2)
      : '0.00';
    
    // Get open inquiries
    const { count: openInquiries } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('dealership_id', profile.dealership_id)
      .eq('status', 'open');
    
    // Get top performing listings
    const { data: topListings } = await supabase
      .from('listings')
      .select('id, year, make, model, trim, price, view_count, inquiry_count')
      .eq('dealership_id', profile.dealership_id)
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .limit(5);
    
    // Get engagement metrics per listing
    const listingIds = topListings?.map(l => l.id) || [];
    const { data: engagementScores } = await supabase
      .from('buyer_engagement_scores')
      .select('listing_id, engagement_score')
      .in('listing_id', listingIds);
    
    const engagementByListing = engagementScores?.reduce((acc: Record<string, number>, score) => {
      if (!acc[score.listing_id]) {
        acc[score.listing_id] = 0;
      }
      acc[score.listing_id] += score.engagement_score || 0;
      return acc;
    }, {}) || {};
    
    const topListingsWithEngagement = topListings?.map(listing => ({
      id: listing.id,
      title: `${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ''}`,
      price: listing.price,
      views: listing.view_count || 0,
      inquiries: listing.inquiry_count || 0,
      totalEngagement: engagementByListing[listing.id] || 0,
      conversionRate: listing.view_count > 0
        ? ((listing.inquiry_count / listing.view_count) * 100).toFixed(2)
        : '0.00',
    })) || [];
    
    // Calculate conversion rate
    const overallConversionRate = analyticsTotals.views > 0
      ? ((analyticsTotals.inquiries / analyticsTotals.views) * 100).toFixed(2)
      : '0.00';
    
    return NextResponse.json({
      listingCounts,
      analytics: {
        ...analyticsTotals,
        conversionRate: parseFloat(overallConversionRate),
      },
      inquirySla: {
        openInquiries: openInquiries || 0,
        totalInquiries: slaTotals.totalInquiries,
        responseRate: parseFloat(responseRate),
        avgResponseTimeMinutes: Math.round(avgResponseTime),
      },
      topListings: topListingsWithEngagement,
      dailyTrends: {
        analytics: analyticsDaily || [],
        sla: slaDaily || [],
      },
    });
  } catch (error) {
    console.error('[DEALER DASHBOARD] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
