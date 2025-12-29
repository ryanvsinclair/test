import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/analytics/listings/[id]
 * 
 * Get analytics for a specific listing
 * 
 * Query Parameters:
 * - days: number (default: 30) - Number of days to include
 * 
 * Security:
 * - Must be authenticated
 * - Must be dealer with dealership_id
 * - Must own listing
 * - RLS enforces ownership
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
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, year, make, model, trim, price, status, view_count, inquiry_count')
      .eq('id', listingId)
      .eq('dealership_id', profile.dealership_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found or access denied' },
        { status: 404 }
      );
    }

    // Get daily analytics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: dailyAnalytics } = await supabase
      .from('listing_analytics_daily')
      .select('*')
      .eq('listing_id', listingId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Calculate totals
    const totals = dailyAnalytics?.reduce(
      (acc, day) => ({
        views: acc.views + (day.view_count || 0),
        saves: acc.saves + (day.save_count || 0),
        inquiries: acc.inquiries + (day.inquiry_count || 0),
        shares: acc.shares + (day.share_count || 0),
        contactClicks: acc.contactClicks + (day.contact_click_count || 0),
        phoneClicks: acc.phoneClicks + (day.phone_click_count || 0),
      }),
      { views: 0, saves: 0, inquiries: 0, shares: 0, contactClicks: 0, phoneClicks: 0 }
    ) || { views: 0, saves: 0, inquiries: 0, shares: 0, contactClicks: 0, phoneClicks: 0 };

    // Calculate conversion rate
    const conversionRate = totals.views > 0
      ? ((totals.inquiries / totals.views) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      listing: {
        id: listing.id,
        title: `${listing.year} ${listing.make} ${listing.model} ${listing.trim || ''}`.trim(),
        price: listing.price,
        status: listing.status,
      },
      totals: {
        ...totals,
        conversionRate: parseFloat(conversionRate),
      },
      dailyAnalytics: dailyAnalytics || [],
    });
  } catch (error) {
    console.error('[DEALER ANALYTICS LISTING] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
