import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/listings/[id]/check-saved
 * 
 * Check if a listing is saved by the current user
 * 
 * Security:
 * - Must be authenticated
 * - RLS enforces user ownership
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
      return NextResponse.json({ isSaved: false });
    }
    
    const listingId = params.id;
    
    // Check if saved (RLS enforces user ownership)
    const { data: savedListing } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('listing_id', listingId)
      .single();
    
    return NextResponse.json({
      isSaved: !!savedListing,
      savedListingId: savedListing?.id || null,
    });
  } catch (error) {
    console.error('[CHECK SAVED] Unexpected error:', error);
    return NextResponse.json({ isSaved: false });
  }
}
