import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dealer/inquiries
 * 
 * Get all inquiries for a dealership
 * 
 * Query Parameters:
 * - status: 'open' | 'replied' | 'closed' (optional)
 * - priority: 'low' | 'normal' | 'high' | 'urgent' (optional)
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Build query (RLS enforces dealership scoping)
    let query = supabase
      .from('inquiries')
      .select(`
        *,
        listing:listings(id, year, make, model, trim, price, primary_image_url),
        buyer:profiles!inquiries_buyer_id_fkey(id, name, email)
      `, { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: inquiries, error, count } = await query;
    
    if (error) {
      console.error('[DEALER INQUIRIES] Error fetching inquiries:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      inquiries: inquiries || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[DEALER INQUIRIES] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
