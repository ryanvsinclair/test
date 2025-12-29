import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/dealerships/[id]/team/invitations
 * 
 * Get all pending invitations for a dealership
 * 
 * Security:
 * - Must be authenticated
 * - Must be an owner of the dealership
 * - RLS enforces ownership check
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const dealershipId = params.id;
  
  // Verify user is an owner of this dealership
  const { data: membership } = await supabase
    .from('team_members')
    .select('role, status')
    .eq('user_id', session.user.id)
    .eq('dealership_id', dealershipId)
    .single();
  
  if (!membership || membership.role !== 'owner' || membership.status !== 'active') {
    return NextResponse.json({ 
      error: 'Forbidden: Only active owners can view invitations' 
    }, { status: 403 });
  }
  
  // Get all invitations (RLS will enforce dealership scoping)
  const { data: invitations, error: invitationsError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('dealership_id', dealershipId)
    .order('created_at', { ascending: false });
  
  if (invitationsError) {
    console.error('[TEAM INVITATIONS] Error fetching invitations:', invitationsError);
    return NextResponse.json({ error: invitationsError.message }, { status: 500 });
  }
  
  return NextResponse.json({ invitations });
}

/**
 * DELETE /api/dealerships/[id]/team/invitations
 * 
 * Revoke a pending invitation
 * 
 * Security:
 * - Must be authenticated
 * - Must be an owner of the dealership
 * - RLS enforces ownership check
 * 
 * Request Body:
 * - invitationId: string (required)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const dealershipId = params.id;
  
  // Verify user is an owner of this dealership
  const { data: membership } = await supabase
    .from('team_members')
    .select('role, status')
    .eq('user_id', session.user.id)
    .eq('dealership_id', dealershipId)
    .single();
  
  if (!membership || membership.role !== 'owner' || membership.status !== 'active') {
    return NextResponse.json({ 
      error: 'Forbidden: Only active owners can revoke invitations' 
    }, { status: 403 });
  }
  
  const body = await request.json();
  const { invitationId } = body;
  
  if (!invitationId) {
    return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 });
  }
  
  // Update invitation status to revoked (RLS will enforce ownership)
  const { error: updateError } = await supabase
    .from('team_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)
    .eq('dealership_id', dealershipId)
    .eq('status', 'pending');
  
  if (updateError) {
    console.error('[TEAM INVITATIONS] Error revoking invitation:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
