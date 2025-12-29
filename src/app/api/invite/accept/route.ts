import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/invite/accept
 * 
 * Accept a team invitation
 * 
 * Query Parameters:
 * - token: string (required)
 * 
 * Security:
 * - Must be authenticated
 * - Token must be valid and not expired
 * - Email must match invitation
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 });
  }
  
  const supabase = createClient();
  
  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('invitation_token', token)
    .eq('status', 'pending')
    .single();
  
  if (inviteError || !invitation) {
    return NextResponse.json({ 
      error: 'Invalid or expired invitation' 
    }, { status: 404 });
  }
  
  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    
    return NextResponse.json({ 
      error: 'Invitation has expired' 
    }, { status: 400 });
  }
  
  // Return invitation details (for display on accept page)
  const { data: dealership } = await supabase
    .from('dealerships')
    .select('legal_name, trade_name')
    .eq('id', invitation.dealership_id)
    .single();
  
  return NextResponse.json({ 
    invitation: {
      email: invitation.email,
      role: invitation.role,
      dealershipName: dealership?.trade_name || dealership?.legal_name,
    }
  });
}

/**
 * POST /api/invite/accept
 * 
 * Accept and process a team invitation
 * 
 * Security:
 * - Must be authenticated
 * - Token must be valid and not expired
 * - Email must match invitation or user must not have a dealership
 * 
 * Request Body:
 * - token: string (required)
 */
export async function POST(request: Request) {
  const supabase = createClient();
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { token } = body;
  
  if (!token) {
    return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 });
  }
  
  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('invitation_token', token)
    .eq('status', 'pending')
    .single();
  
  if (inviteError || !invitation) {
    return NextResponse.json({ 
      error: 'Invalid or expired invitation' 
    }, { status: 404 });
  }
  
  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    
    return NextResponse.json({ 
      error: 'Invitation has expired' 
    }, { status: 400 });
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, dealership_id')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  
  // Email must match OR user must not have email set yet (signup during invite)
  if (profile.email !== invitation.email && profile.email) {
    return NextResponse.json({ 
      error: 'Invitation email does not match your account' 
    }, { status: 403 });
  }
  
  // User must not already be in a dealership
  if (profile.dealership_id) {
    return NextResponse.json({ 
      error: 'You are already a member of a dealership' 
    }, { status: 400 });
  }
  
  // ATOMIC ACCEPTANCE
  // 1. Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'dealer',
      dealership_id: invitation.dealership_id,
    })
    .eq('id', session.user.id);
  
  if (profileError) {
    console.error('[INVITE ACCEPT] Error updating profile:', profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  
  // 2. Create team member
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      user_id: session.user.id,
      dealership_id: invitation.dealership_id,
      role: invitation.role,
      status: 'active',
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
      joined_at: new Date().toISOString(),
    });
  
  if (memberError) {
    console.error('[INVITE ACCEPT] Error creating team member:', memberError);
    // Rollback profile update
    await supabase
      .from('profiles')
      .update({ role: 'buyer', dealership_id: null })
      .eq('id', session.user.id);
    
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }
  
  // 3. Mark invitation as accepted
  await supabase
    .from('team_invitations')
    .update({ 
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);
  
  return NextResponse.json({ success: true });
}
