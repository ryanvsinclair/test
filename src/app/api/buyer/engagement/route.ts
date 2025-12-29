import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/buyer/engagement
 * 
 * Get buyer engagement summary
 * 
 * Security:
 * - Must be authenticated
 * - RLS enforces user ownership
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get engagement scores (RLS enforces user ownership)
    const { data: engagementScores } = await supabase
      .from('buyer_engagement_scores')
      .select(`
        *,
        listing:listings(
          id,
          year,
          make,
          model,
          trim,
          price,
          primary_image_url,
          status
        )
      `)
      .order('engagement_score', { ascending: false })
      .limit(20);
    
    // Get saved listings count
    const { count: savedCount } = await supabase
      .from('saved_listings')
      .select('id', { count: 'exact', head: true });
    
    // Get inquiries count
    const { count: inquiriesCount } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', session.user.id);
    
    // Get viewed listings count (approximate)
    const { count: viewedCount } = await supabase
      .from('buyer_engagement_scores')
      .select('id', { count: 'exact', head: true })
      .gt('view_count', 0);
    
    return NextResponse.json({
      summary: {
        savedListings: savedCount || 0,
        inquiriesSent: inquiriesCount || 0,
        listingsViewed: viewedCount || 0,
      },
      topEngaged: engagementScores || [],
    });
  } catch (error) {
    console.error('[BUYER ENGAGEMENT] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
