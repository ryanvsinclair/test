import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * PATCH /api/admin/listings/[id]/moderate
 * 
 * Admin moderation actions on listings
 * 
 * Security:
 * - Must be authenticated
 * - Must be admin (is_admin = true)
 * 
 * Actions:
 * - approve: Set status to active (if pending_approval)
 * - reject: Set status to draft
 * - disable: Set status to deleted (soft delete)
 * - override_mode: Change marketplace_mode
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const adminSupabase = getSupabaseAdminClient();
  
  // Verify admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.user_metadata?.is_admin !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const listingId = params.id;
  const body = await request.json();
  const { action, marketplaceMode, reason } = body;

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  // Get listing
  const { data: listing, error: listingError } = await adminSupabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  let updates: any = {
    updated_at: new Date().toISOString(),
  };

  switch (action) {
    case 'approve':
      if (listing.status !== 'pending_approval') {
        return NextResponse.json({ 
          error: 'Listing is not pending approval' 
        }, { status: 400 });
      }
      updates.status = 'active';
      updates.published_at = new Date().toISOString();
      break;

    case 'reject':
      updates.status = 'draft';
      break;

    case 'disable':
      updates.status = 'deleted';
      break;

    case 'override_mode':
      if (!marketplaceMode) {
        return NextResponse.json({ 
          error: 'Missing marketplaceMode for override' 
        }, { status: 400 });
      }
      updates.marketplace_mode = marketplaceMode;
      updates.assigned_marketplace_mode = marketplaceMode;
      updates.road_readiness_state = marketplaceMode;
      updates.assigned_road_readiness_state = marketplaceMode;
      break;

    default:
      return NextResponse.json({ 
        error: 'Invalid action. Must be: approve, reject, disable, or override_mode' 
      }, { status: 400 });
  }

  // Apply updates
  const { data: updatedListing, error: updateError } = await adminSupabase
    .from('listings')
    .update(updates)
    .eq('id', listingId)
    .select()
    .single();

  if (updateError) {
    console.error('[ADMIN MODERATE] Error updating listing:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    listing: updatedListing 
  });
}
