// Team Member Invitation System
// Handles email-based team member onboarding with domain enforcement

import { TeamMember } from '@/types/dealer';

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'sales' | 'manager' | 'admin';
  dealershipId: string;
  invitedBy: string;
  invitationToken: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface PendingTeamMember extends TeamMember {
  status: 'invited' | 'active';
  invitedAt?: Date;
  invitedBy?: string;
}

// Mock storage for invitations (replace with actual database)
const mockInvitations: Map<string, TeamInvitation> = new Map();
const mockPendingMembers: Map<string, PendingTeamMember> = new Map();

// Generate secure invitation token
function generateInvitationToken(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

// Validate email domain against dealership domain
function validateDomain(email: string, dealershipEmail: string): boolean {
  const emailDomain = email.toLowerCase().split('@')[1];
  const dealershipDomain = dealershipEmail.toLowerCase().split('@')[1];
  return emailDomain === dealershipDomain;
}

// Send invitation email (mock implementation)
async function sendInvitationEmail(invitation: TeamInvitation, dealershipName: string): Promise<void> {
  // TODO: Replace with actual email service (SendGrid, AWS SES, etc.)
  console.log('Sending invitation email:', {
    to: invitation.email,
    subject: `You've been invited to join ${dealershipName}`,
    inviteLink: `${window.location.origin}/invite/accept?token=${invitation.invitationToken}`,
  });

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Invite a new team member
export async function inviteTeamMember(params: {
  email: string;
  role: 'sales' | 'manager' | 'admin';
  dealershipId: string;
  dealershipEmail?: string;
  dealershipName?: string;
  invitedBy?: string;
}): Promise<TeamInvitation> {
  const { email, role, dealershipId, dealershipEmail, dealershipName, invitedBy } = params;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address');
  }

  // Domain validation (if dealership email provided)
  if (dealershipEmail && !validateDomain(email, dealershipEmail)) {
    const dealershipDomain = dealershipEmail.split('@')[1];
    throw new Error(`Team members must use your dealership's email domain (@${dealershipDomain})`);
  }

  // Check for duplicate invitations
  for (const [, invite] of mockInvitations) {
    if (invite.email === email && invite.dealershipId === dealershipId && invite.status === 'pending') {
      throw new Error('An invitation has already been sent to this email address');
    }
  }

  // Check if email already exists as active member
  for (const [, member] of mockPendingMembers) {
    if (member.email === email && member.status === 'active') {
      throw new Error('This email is already associated with an active team member');
    }
  }

  // Create invitation
  const invitationToken = generateInvitationToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours

  const invitation: TeamInvitation = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email,
    role,
    dealershipId,
    invitedBy: invitedBy || 'unknown',
    invitationToken,
    status: 'pending',
    createdAt: now,
    expiresAt,
  };

  // Store invitation
  mockInvitations.set(invitation.id, invitation);

  // Create pending team member record
  const pendingMember: PendingTeamMember = {
    id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '', // Will be set during acceptance
    email,
    role,
    active: false,
    status: 'invited',
    invitedAt: now,
    invitedBy: invitedBy || 'unknown',
  };

  mockPendingMembers.set(pendingMember.id, pendingMember);

  // Send invitation email
  await sendInvitationEmail(invitation, dealershipName || 'the dealership');

  return invitation;
}

// Resend invitation
export async function resendInvitation(invitationId: string): Promise<void> {
  const invitation = mockInvitations.get(invitationId);
  
  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Cannot resend a non-pending invitation');
  }

  // Check if expired
  if (new Date() > invitation.expiresAt) {
    invitation.status = 'expired';
    throw new Error('Invitation has expired. Please create a new invitation.');
  }

  // Resend email
  await sendInvitationEmail(invitation, 'the dealership');
}

// Revoke invitation
export async function revokeInvitation(invitationId: string): Promise<void> {
  const invitation = mockInvitations.get(invitationId);
  
  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Cannot revoke a non-pending invitation');
  }

  invitation.status = 'revoked';

  // Remove pending member
  for (const [id, member] of mockPendingMembers) {
    if (member.email === invitation.email && member.status === 'invited') {
      mockPendingMembers.delete(id);
      break;
    }
  }
}

// Validate invitation token
export async function validateInvitationToken(token: string): Promise<TeamInvitation | null> {
  for (const [, invitation] of mockInvitations) {
    if (invitation.invitationToken === token) {
      // Check if expired
      if (new Date() > invitation.expiresAt) {
        invitation.status = 'expired';
        return null;
      }

      // Check if already used
      if (invitation.status !== 'pending') {
        return null;
      }

      return invitation;
    }
  }

  return null;
}

// Accept invitation and complete account setup
export async function acceptInvitation(params: {
  token: string;
  name: string;
  password: string;
}): Promise<TeamMember> {
  const { token, name, password } = params;

  // Validate token
  const invitation = await validateInvitationToken(token);
  
  if (!invitation) {
    throw new Error('Invalid or expired invitation token');
  }

  // Validate password
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Mark invitation as accepted
  invitation.status = 'accepted';
  invitation.acceptedAt = new Date();

  // Update pending member to active
  for (const [id, member] of mockPendingMembers) {
    if (member.email === invitation.email && member.status === 'invited') {
      member.name = name;
      member.active = true;
      member.status = 'active';

      // TODO: Hash password and store securely
      // TODO: Create actual user account with proper authentication

      return member as TeamMember;
    }
  }

  throw new Error('Pending member record not found');
}

// Get all pending invitations for a dealership
export async function getPendingInvitations(dealershipId: string): Promise<TeamInvitation[]> {
  const pending: TeamInvitation[] = [];
  
  for (const [, invitation] of mockInvitations) {
    if (invitation.dealershipId === dealershipId && invitation.status === 'pending') {
      // Check if expired
      if (new Date() > invitation.expiresAt) {
        invitation.status = 'expired';
      } else {
        pending.push(invitation);
      }
    }
  }

  return pending;
}

// Get all team members (including pending) for a dealership
export async function getTeamMembersWithPending(dealershipId: string): Promise<PendingTeamMember[]> {
  const members: PendingTeamMember[] = [];
  
  for (const [, member] of mockPendingMembers) {
    // TODO: Filter by dealershipId once proper data structure is in place
    members.push(member);
  }

  return members;
}
