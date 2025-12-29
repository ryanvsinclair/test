import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/analytics/overview
 * 
 * Get dealership-level analytics overview
 * 
 * Query Parameters:
 * - days: number (default: 30) - Number of days to include
 * 
 * Security:
 * - Must be authenticated
 * - Must be dealer with dealership_id
 * - RLS enforces dealership scoping
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

    // Get daily analytics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: dailyAnalytics } = await supabase
      .from('dealership_analytics_daily')
      .select('*')
      .eq('dealership_id', profile.dealership_id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Calculate totals
    const totals = dailyAnalytics?.reduce(
      (acc, day) => ({
        views: acc.views + (day.total_views || 0),
        saves: acc.saves + (day.total_saves || 0),
        inquiries: acc.inquiries + (day.total_inquiries || 0),
        shares: acc.shares + (day.total_shares || 0),
        newListings: acc.newListings + (day.new_listings_count || 0),
        soldListings: acc.soldListings + (day.sold_listings_count || 0),
      }),
      { views: 0, saves: 0, inquiries: 0, shares: 0, newListings: 0, soldListings: 0 }
    ) || { views: 0, saves: 0, inquiries: 0, shares: 0, newListings: 0, soldListings: 0 };

    // Get current listing counts
    const { data: listingCounts } = await supabase
      .from('listings')
      .select('status')
      .eq('dealership_id', profile.dealership_id);

    const statusCounts = {
      active: listingCounts?.filter(l => l.status === 'active').length || 0,
      draft: listingCounts?.filter(l => l.status === 'draft').length || 0,
      sold: listingCounts?.filter(l => l.status === 'sold').length || 0,
      total: listingCounts?.length || 0,
    };

    // Get top performing listings
    const { data: topListings } = await supabase
      .from('listings')
      .select('id, year, make, model, trim, price, view_count, inquiry_count')
      .eq('dealership_id', profile.dealership_id)
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .limit(5);

    // Calculate conversion rate
    const conversionRate = totals.views > 0
      ? ((totals.inquiries / totals.views) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      totals: {
        ...totals,
        conversionRate: parseFloat(conversionRate),
      },
      listingCounts: statusCounts,
      topListings: topListings?.map(listing => ({
        id: listing.id,
        title: `${listing.year} ${listing.make} ${listing.model} ${listing.trim || ''}`.trim(),
        price: listing.price,
        views: listing.view_count || 0,
        inquiries: listing.inquiry_count || 0,
        conversionRate: listing.view_count > 0
          ? ((listing.inquiry_count / listing.view_count) * 100).toFixed(2)
          : '0.00',
      })) || [],
      dailyAnalytics: dailyAnalytics || [],
    });
  } catch (error) {
    console.error('[DEALER ANALYTICS OVERVIEW] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
