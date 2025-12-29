import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDealerDashboardData } from '@/lib/db/dealer-dashboard';

/**
 * GET /api/dealer/dashboard
 * 
 * Returns dashboard data for authenticated dealer.
 * Requires valid dealer session with dealership_id.
 * 
 * Security:
 * - Server-side auth validation via Supabase
 * - Dealership ID from profiles.dealership_id
 * - All queries scoped to dealership
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
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
    
    // Fetch dashboard data scoped to dealership
    const data = await getDealerDashboardData(profile.dealership_id);
    
    console.log('Dashboard loaded', {
      requestId,
      dealershipId: profile.dealership_id,
      userId: session.user.id,
      email: session.user.email,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(data, {
      headers: {
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    console.error('Dashboard API error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
