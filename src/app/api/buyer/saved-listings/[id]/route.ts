import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/buyer/saved-listings/[id]
 * 
 * Unsave a listing
 * 
 * Security:
 * - Must be authenticated
 * - RLS enforces user ownership
 */
export async function DELETE(
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
    
    const savedListingId = params.id;
    
    // Delete saved listing (RLS enforces user ownership)
    const { error: deleteError } = await supabase
      .from('saved_listings')
      .delete()
      .eq('id', savedListingId);
    
    if (deleteError) {
      console.error('[SAVED LISTINGS] Error unsaving listing:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SAVED LISTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/buyer/saved-listings/[id]
 * 
 * Update saved listing notes
 * 
 * Request Body:
 * - notes: string
 * 
 * Security:
 * - Must be authenticated
 * - RLS enforces user ownership
 */
export async function PATCH(
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
    
    const savedListingId = params.id;
    const body = await request.json();
    const { notes } = body;
    
    // Update saved listing (RLS enforces user ownership)
    const { data: savedListing, error: updateError } = await supabase
      .from('saved_listings')
      .update({ notes })
      .eq('id', savedListingId)
      .select()
      .single();
    
    if (updateError) {
      console.error('[SAVED LISTINGS] Error updating notes:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, savedListing });
  } catch (error) {
    console.error('[SAVED LISTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
