import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/dealerships/[id]/team/members
 * 
 * Get all team members for a dealership
 * 
 * Security:
 * - Must be authenticated
 * - Must be a team member of the dealership
 * - RLS enforces membership check
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
  
  // Verify user is a team member of this dealership
  const { data: membership } = await supabase
    .from('team_members')
    .select('role, status')
    .eq('user_id', session.user.id)
    .eq('dealership_id', dealershipId)
    .single();
  
  if (!membership || membership.status !== 'active') {
    return NextResponse.json({ 
      error: 'Forbidden: Must be an active team member' 
    }, { status: 403 });
  }
  
  // Get all team members (RLS will enforce dealership scoping)
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`
      id,
      user_id,
      role,
      status,
      invited_by,
      invited_at,
      joined_at,
      created_at
    `)
    .eq('dealership_id', dealershipId)
    .order('created_at', { ascending: true });
  
  if (membersError) {
    console.error('[TEAM MEMBERS] Error fetching members:', membersError);
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }
  
  // Get user details for each member
  const userIds = members.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, name')
    .in('id', userIds);
  
  // Enrich members with profile data
  const enrichedMembers = members.map(member => {
    const profile = profiles?.find(p => p.id === member.user_id);
    return {
      ...member,
      email: profile?.email,
      name: profile?.name,
    };
  });
  
  return NextResponse.json({ members: enrichedMembers });
}

/**
 * DELETE /api/dealerships/[id]/team/members
 * 
 * Remove a team member from a dealership
 * 
 * Security:
 * - Must be authenticated
 * - Must be an owner of the dealership
 * - Cannot remove yourself
 * - RLS enforces ownership check
 * 
 * Request Body:
 * - userId: string (required)
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
      error: 'Forbidden: Only active owners can remove team members' 
    }, { status: 403 });
  }
  
  const body = await request.json();
  const { userId } = body;
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  
  // Cannot remove yourself
  if (userId === session.user.id) {
    return NextResponse.json({ 
      error: 'Cannot remove yourself from the team' 
    }, { status: 400 });
  }
  
  // Remove team member (RLS will enforce ownership)
  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('user_id', userId)
    .eq('dealership_id', dealershipId);
  
  if (deleteError) {
    console.error('[TEAM MEMBERS] Error removing member:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  
  // Also unlink from profile
  await supabase
    .from('profiles')
    .update({ dealership_id: null, role: 'buyer' })
    .eq('id', userId);
  
  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/dealerships/[id]/team/members
 * 
 * Update a team member's role
 * 
 * Security:
 * - Must be authenticated
 * - Must be an owner of the dealership
 * - Cannot change your own role
 * - RLS enforces ownership check
 * 
 * Request Body:
 * - userId: string (required)
 * - role: 'owner' | 'sales' | 'finance' | 'viewer' (required)
 */
export async function PATCH(
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
      error: 'Forbidden: Only active owners can update team member roles' 
    }, { status: 403 });
  }
  
  const body = await request.json();
  const { userId, role } = body;
  
  if (!userId || !role) {
    return NextResponse.json({ 
      error: 'Missing required fields: userId, role' 
    }, { status: 400 });
  }
  
  if (!['owner', 'sales', 'finance', 'viewer'].includes(role)) {
    return NextResponse.json({ 
      error: 'Invalid role. Must be: owner, sales, finance, or viewer' 
    }, { status: 400 });
  }
  
  // Cannot change your own role
  if (userId === session.user.id) {
    return NextResponse.json({ 
      error: 'Cannot change your own role' 
    }, { status: 400 });
  }
  
  // Update team member role (RLS will enforce ownership)
  const { error: updateError } = await supabase
    .from('team_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('dealership_id', dealershipId);
  
  if (updateError) {
    console.error('[TEAM MEMBERS] Error updating member role:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
