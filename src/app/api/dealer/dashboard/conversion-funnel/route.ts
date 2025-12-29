import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/dashboard/conversion-funnel
 * 
 * Get conversion funnel data (view → save → inquiry)
 * 
 * Query Parameters:
 * - days: number (default: 30)
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
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get analytics totals
    const { data: analyticsDaily } = await supabase
      .from('dealership_analytics_daily')
      .select('total_views, total_saves, total_inquiries')
      .eq('dealership_id', profile.dealership_id)
      .gte('date', startDate.toISOString().split('T')[0]);
    
    const totals = analyticsDaily?.reduce(
      (acc, day) => ({
        views: acc.views + (day.total_views || 0),
        saves: acc.saves + (day.total_saves || 0),
        inquiries: acc.inquiries + (day.total_inquiries || 0),
      }),
      { views: 0, saves: 0, inquiries: 0 }
    ) || { views: 0, saves: 0, inquiries: 0 };
    
    // Calculate conversion rates
    const viewToSaveRate = totals.views > 0
      ? ((totals.saves / totals.views) * 100).toFixed(2)
      : '0.00';
    
    const saveToInquiryRate = totals.saves > 0
      ? ((totals.inquiries / totals.saves) * 100).toFixed(2)
      : '0.00';
    
    const viewToInquiryRate = totals.views > 0
      ? ((totals.inquiries / totals.views) * 100).toFixed(2)
      : '0.00';
    
    // Get daily breakdown for trend
    const dailyFunnel = analyticsDaily?.map(day => ({
      date: day.date,
      views: day.total_views || 0,
      saves: day.total_saves || 0,
      inquiries: day.total_inquiries || 0,
      viewToSaveRate: day.total_views > 0
        ? parseFloat(((day.total_saves / day.total_views) * 100).toFixed(2))
        : 0,
      viewToInquiryRate: day.total_views > 0
        ? parseFloat(((day.total_inquiries / day.total_views) * 100).toFixed(2))
        : 0,
    })) || [];
    
    return NextResponse.json({
      funnel: {
        views: totals.views,
        saves: totals.saves,
        inquiries: totals.inquiries,
        viewToSaveRate: parseFloat(viewToSaveRate),
        saveToInquiryRate: parseFloat(saveToInquiryRate),
        viewToInquiryRate: parseFloat(viewToInquiryRate),
      },
      dailyFunnel,
    });
  } catch (error) {
    console.error('[CONVERSION FUNNEL] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
