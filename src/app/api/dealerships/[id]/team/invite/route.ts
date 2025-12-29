import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/dealerships/[id]/team/invite
 * 
 * Invite a user to join a dealership team
 * 
 * Security:
 * - Must be authenticated
 * - Must be a team member of the dealership
 * - Must have role='owner'
 * - RLS enforces ownership check
 * 
 * Request Body:
 * - email: string (required)
 * - role: 'owner' | 'sales' | 'finance' | 'viewer' (required)
 */
export async function POST(
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
  
  // Verify user is a team member of this dealership with owner role
  const { data: membership } = await supabase
    .from('team_members')
    .select('role, status')
    .eq('user_id', session.user.id)
    .eq('dealership_id', dealershipId)
    .single();
  
  if (!membership || membership.role !== 'owner' || membership.status !== 'active') {
    return NextResponse.json({ 
      error: 'Forbidden: Only active owners can invite team members' 
    }, { status: 403 });
  }
  
  const body = await request.json();
  const { email, role } = body;
  
  if (!email || !role) {
    return NextResponse.json({ 
      error: 'Missing required fields: email, role' 
    }, { status: 400 });
  }
  
  if (!['owner', 'sales', 'finance', 'viewer'].includes(role)) {
    return NextResponse.json({ 
      error: 'Invalid role. Must be: owner, sales, finance, or viewer' 
    }, { status: 400 });
  }
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id, dealership_id')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    // Check if already a member of this dealership
    if (existingUser.dealership_id === dealershipId) {
      return NextResponse.json({ 
        error: 'User is already a member of this dealership' 
      }, { status: 400 });
    }
    
    // Check if member of another dealership
    if (existingUser.dealership_id) {
      return NextResponse.json({ 
        error: 'User is already a member of another dealership' 
      }, { status: 400 });
    }
  }
  
  // Check for pending invitation
  const { data: existingInvite } = await supabase
    .from('team_invitations')
    .select('id, status')
    .eq('email', email)
    .eq('dealership_id', dealershipId)
    .eq('status', 'pending')
    .single();
  
  if (existingInvite) {
    return NextResponse.json({ 
      error: 'Invitation already sent to this email' 
    }, { status: 400 });
  }
  
  // Generate invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  
  // Create invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const { data: invitation, error: inviteError } = await supabase
    .from('team_invitations')
    .insert({
      email,
      role,
      dealership_id: dealershipId,
      invited_by: session.user.id,
      invitation_token: invitationToken,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  
  if (inviteError) {
    console.error('[TEAM INVITE] Error creating invitation:', inviteError);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }
  
  // TODO: Send email with invitation link
  // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitationToken}`;
  
  return NextResponse.json({ 
    success: true, 
    invitation,
    // inviteUrl 
  });
}
