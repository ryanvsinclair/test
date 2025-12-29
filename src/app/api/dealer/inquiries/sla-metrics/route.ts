import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/inquiries/sla-metrics
 * 
 * Get SLA metrics for a dealership
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
    
    // Get daily SLA metrics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: dailyMetrics } = await supabase
      .from('inquiry_sla_metrics_daily')
      .select('*')
      .eq('dealership_id', profile.dealership_id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    // Calculate totals
    const totals = dailyMetrics?.reduce(
      (acc, day) => ({
        totalInquiries: acc.totalInquiries + (day.total_inquiries || 0),
        repliedInquiries: acc.repliedInquiries + (day.replied_inquiries || 0),
        closedInquiries: acc.closedInquiries + (day.closed_inquiries || 0),
      }),
      { totalInquiries: 0, repliedInquiries: 0, closedInquiries: 0 }
    ) || { totalInquiries: 0, repliedInquiries: 0, closedInquiries: 0 };
    
    // Calculate averages
    const avgResponseTime = dailyMetrics?.length
      ? dailyMetrics.reduce((sum, day) => sum + (day.avg_response_time_minutes || 0), 0) / dailyMetrics.length
      : 0;
    
    const responseRate = totals.totalInquiries > 0
      ? ((totals.repliedInquiries / totals.totalInquiries) * 100).toFixed(2)
      : '0.00';
    
    // Get current open inquiries
    const { data: openInquiries, count: openCount } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact' })
      .eq('dealership_id', profile.dealership_id)
      .eq('status', 'open');
    
    return NextResponse.json({
      totals: {
        ...totals,
        avgResponseTimeMinutes: Math.round(avgResponseTime),
        responseRate: parseFloat(responseRate),
        openInquiries: openCount || 0,
      },
      dailyMetrics: dailyMetrics || [],
    });
  } catch (error) {
    console.error('[DEALER SLA METRICS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
