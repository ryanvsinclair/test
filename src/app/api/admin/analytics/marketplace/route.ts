import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/analytics/marketplace
 * 
 * Admin-level marketplace insights
 * 
 * Query Parameters:
 * - days: number (default: 30) - Number of days to include
 * 
 * Security:
 * - Must be authenticated
 * - Must be admin (is_admin = true)
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const adminSupabase = getSupabaseAdminClient();

  // Verify admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.user_metadata?.is_admin !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all dealership analytics
  const { data: dealershipAnalytics } = await adminSupabase
    .from('dealership_analytics_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Calculate marketplace totals
  const totals = dealershipAnalytics?.reduce(
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

  // Get top performing dealerships
  const { data: topDealerships } = await adminSupabase
    .from('dealerships')
    .select(`
      id,
      legal_name,
      trade_name,
      city,
      region
    `)
    .eq('lifecycle_status', 'active')
    .limit(10);

  // Get listing counts by dealership
  const dealershipIds = topDealerships?.map(d => d.id) || [];
  const { data: listingCounts } = await adminSupabase
    .from('listings')
    .select('dealership_id, status')
    .in('dealership_id', dealershipIds)
    .eq('status', 'active');

  // Count active listings per dealership
  const listingCountsByDealership = listingCounts?.reduce((acc: Record<string, number>, listing) => {
    acc[listing.dealership_id] = (acc[listing.dealership_id] || 0) + 1;
    return acc;
  }, {}) || {};

  // Get analytics per dealership
  const dealershipPerformance = await Promise.all(
    (topDealerships || []).map(async (dealership) => {
      const { data: analytics } = await adminSupabase
        .from('dealership_analytics_daily')
        .select('total_views, total_inquiries')
        .eq('dealership_id', dealership.id)
        .gte('date', startDate.toISOString().split('T')[0]);

      const dealershipTotals = analytics?.reduce(
        (acc, day) => ({
          views: acc.views + (day.total_views || 0),
          inquiries: acc.inquiries + (day.total_inquiries || 0),
        }),
        { views: 0, inquiries: 0 }
      ) || { views: 0, inquiries: 0 };

      return {
        id: dealership.id,
        name: dealership.trade_name || dealership.legal_name,
        location: `${dealership.city}, ${dealership.region}`,
        activeListings: listingCountsByDealership[dealership.id] || 0,
        views: dealershipTotals.views,
        inquiries: dealershipTotals.inquiries,
        conversionRate: dealershipTotals.views > 0
          ? parseFloat(((dealershipTotals.inquiries / dealershipTotals.views) * 100).toFixed(2))
          : 0,
      };
    })
  );

  // Sort by views
  dealershipPerformance.sort((a, b) => b.views - a.views);

  // Get marketplace stats
  const { data: allListings } = await adminSupabase
    .from('listings')
    .select('status, marketplace_mode');

  const marketplaceStats = {
    totalListings: allListings?.length || 0,
    byStatus: {
      active: allListings?.filter(l => l.status === 'active').length || 0,
      draft: allListings?.filter(l => l.status === 'draft').length || 0,
      sold: allListings?.filter(l => l.status === 'sold').length || 0,
    },
    byMarketplaceMode: allListings?.reduce((acc: Record<string, number>, listing) => {
      if (listing.marketplace_mode) {
        acc[listing.marketplace_mode] = (acc[listing.marketplace_mode] || 0) + 1;
      }
      return acc;
    }, {}) || {},
  };

  const conversionRate = totals.views > 0
    ? ((totals.inquiries / totals.views) * 100).toFixed(2)
    : '0.00';

  return NextResponse.json({
    totals: {
      ...totals,
      conversionRate: parseFloat(conversionRate),
    },
    marketplaceStats,
    topDealerships: dealershipPerformance,
    dailyTrends: dealershipAnalytics || [],
  });
}
