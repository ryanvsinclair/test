import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/buyer/inquiries
 * 
 * Get all inquiries for a buyer
 * 
 * Query Parameters:
 * - status: 'open' | 'replied' | 'closed' (optional)
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * 
 * Security:
 * - Must be authenticated
 * - RLS enforces buyer ownership
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Build query (RLS enforces buyer ownership)
    let query = supabase
      .from('inquiries')
      .select(`
        *,
        listing:listings(id, year, make, model, trim, price, primary_image_url, status)
      `, { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: inquiries, error, count } = await query;
    
    if (error) {
      console.error('[BUYER INQUIRIES] Error fetching inquiries:', error);
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
    console.error('[BUYER INQUIRIES] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
