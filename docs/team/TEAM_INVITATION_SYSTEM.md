# Team Member Invitation System

## Overview

Secure email-based team member onboarding system for dealer accounts. Enforces dealership domain validation and prevents unauthorized access.

## Architecture

### Components

1. **AddTeamMemberDialog** (`src/components/dealer/AddTeamMemberDialog.tsx`)
   - Modal UI for inviting team members
   - Real-time email validation
   - Domain enforcement
   - Role selection (Sales / Manager / Admin)

2. **Team Invites API** (`src/lib/api/team-invites.ts`)
   - Invitation creation and management
   - Token generation and validation
   - Email sending simulation
   - Duplicate prevention

3. **Invite Accept Page** (`src/app/invite/accept/page.tsx`)
   - Public route for invitation acceptance
   - Token validation
   - Account setup form (name + password)
   - Success confirmation

4. **Database Schema** (`src/lib/db/schema-team-invites.sql`)
   - `team_invitations` table
   - `team_members` table
   - Indexes and constraints
   - Domain validation function

## User Flow

### 1. Invitation Phase

```
Dealer clicks "Add Member" → Opens dialog
  ↓
Enters team member email
  ↓
System validates domain match
  ↓
If valid → Creates invitation record
  ↓
Sends email with secure link
  ↓
Shows success message
```

### 2. Acceptance Phase

```
Recipient clicks link → Opens /invite/accept?token=XYZ
  ↓
System validates token (not expired, not used)
  ↓
If valid → Shows setup form
  ↓
User enters name + password
  ↓
Account activated → Redirects to login
```

## Security Features

### Domain Enforcement

**Rule:** Invited email MUST match the dealership's primary email domain.

**Example:**
- Primary dealer: `owner@forddealership.com`
- Allowed: `sales@forddealership.com` ✅
- Blocked: `sales@gmail.com` ❌

**Implementation:**
```typescript
const dealerDomain = dealerEmail.split('@')[1];
const emailDomain = email.split('@')[1];
if (emailDomain !== dealerDomain) {
  throw new Error('Domain mismatch');
}
```

### Token Security

- **Length:** 64 characters (random alphanumeric)
- **Single-use:** Marked as 'accepted' after use
- **Time-limited:** Expires after 72 hours
- **Unique:** Database constraint prevents duplicates

### Duplicate Prevention

**Database constraints:**
```sql
CREATE UNIQUE INDEX idx_team_invitations_unique 
  ON team_invitations(email, dealership_id) 
  WHERE status = 'pending';
```

Prevents multiple pending invites to the same email.

### Data Validation

- Email format validation (regex)
- Password minimum length (8 characters)
- Role type checking (sales/manager/admin)
- Name required (non-empty)

## API Reference

### `inviteTeamMember()`

**Purpose:** Create and send a team member invitation.

**Parameters:**
```typescript
{
  email: string;              // Team member email
  role: 'sales' | 'manager' | 'admin';
  dealershipId: string;
  dealershipEmail?: string;   // For domain validation
  dealershipName?: string;    // For email content
  invitedBy?: string;         // User ID of inviter
}
```

**Returns:** `Promise<TeamInvitation>`

**Throws:**
- Domain mismatch
- Duplicate invitation
- Email already active
- Invalid email format

### `validateInvitationToken()`

**Purpose:** Check if an invitation token is valid and not expired.

**Parameters:**
```typescript
token: string;  // From URL query param
```

**Returns:** `Promise<TeamInvitation | null>`

**Validation checks:**
- Token exists
- Not expired
- Status is 'pending'

### `acceptInvitation()`

**Purpose:** Complete account setup and activate team member.

**Parameters:**
```typescript
{
  token: string;
  name: string;
  password: string;
}
```

**Returns:** `Promise<TeamMember>`

**Process:**
1. Validate token
2. Validate password strength
3. Mark invitation as 'accepted'
4. Activate team member record
5. Create user account (hash password)

### `resendInvitation()`

**Purpose:** Resend invitation email for pending invite.

**Parameters:**
```typescript
invitationId: string;
```

**Throws:**
- Invitation not found
- Already accepted
- Expired (create new instead)

### `revokeInvitation()`

**Purpose:** Cancel a pending invitation.

**Parameters:**
```typescript
invitationId: string;
```

**Effect:**
- Sets status to 'revoked'
- Removes pending member record
- Token becomes invalid

## UI States

### Team List Display

**Active member:**
```tsx
<Badge variant="outline" className="bg-green-50">
  Active
</Badge>
```

**Invited (pending):**
```tsx
<Badge variant="outline" className="bg-amber-50">
  <MailCheck className="w-3 h-3" />
  Invited
</Badge>
```

### Dialog States

1. **Input state:** Email + role selection
2. **Submitting:** Loading spinner + disabled inputs
3. **Success:** Green checkmark + confirmation message
4. **Error:** Red alert with specific message

### Acceptance Page States

1. **Validating:** Loading spinner
2. **Invalid token:** Error card + "Go to Home" button
3. **Valid:** Setup form (name + password)
4. **Submitting:** Loading state on button
5. **Complete:** Success message + auto-redirect

## Error Messages

### Dialog Errors

- `"Email is required"`
- `"Please enter a valid email address"`
- `"Team members must use your dealership's email domain (@example.com)"`
- `"An invitation has already been sent to this email address"`
- `"This email is already associated with an active team member"`
- `"Failed to send invitation. Please try again."`

### Acceptance Page Errors

- `"Invalid invitation link"`
- `"This invitation link is invalid or has expired"`
- `"Please enter your name"`
- `"Password must be at least 8 characters"`
- `"Passwords do not match"`
- `"Failed to complete setup. Please try again."`

## Email Template (Mock)

**Subject:** `You've been invited to join [Dealership Name]`

**Content:**
```
Hi,

You've been invited to join [Dealership Name] as a [Role] team member.

Click the button below to complete your account setup:

[Complete Your Account Button]
→ Links to: /invite/accept?token=XYZ

This invitation expires in 72 hours.

If you didn't expect this invitation, you can safely ignore this email.

— Carly Team
```

## Database Schema

### team_invitations

| Column            | Type        | Description                        |
|-------------------|-------------|------------------------------------|
| id                | UUID        | Primary key                        |
| email             | VARCHAR     | Invitee email                      |
| role              | VARCHAR     | sales / manager / admin            |
| dealership_id     | UUID        | Foreign key to dealers             |
| invited_by        | UUID        | Foreign key to users               |
| invitation_token  | VARCHAR     | Secure unique token                |
| status            | VARCHAR     | pending / accepted / expired / revoked |
| created_at        | TIMESTAMPTZ | Invitation creation time           |
| expires_at        | TIMESTAMPTZ | Token expiration (72 hours)        |
| accepted_at       | TIMESTAMPTZ | Acceptance timestamp               |

**Indexes:**
- `invitation_token` (unique)
- `email`
- `dealership_id`
- `status`
- Composite: `(email, dealership_id)` for pending duplicates

### team_members

| Column         | Type        | Description                        |
|----------------|-------------|------------------------------------|
| id             | UUID        | Primary key                        |
| user_id        | UUID        | Foreign key to users (unique)      |
| dealership_id  | UUID        | Foreign key to dealers             |
| role           | VARCHAR     | owner / sales / manager / admin    |
| status         | VARCHAR     | active / inactive / invited        |
| invited_by     | UUID        | Who sent the invitation            |
| invited_at     | TIMESTAMPTZ | When invited                       |
| joined_at      | TIMESTAMPTZ | When accepted                      |
| created_at     | TIMESTAMPTZ | Record creation                    |
| updated_at     | TIMESTAMPTZ | Last update                        |

**Indexes:**
- `dealership_id`
- `user_id`
- `status`
- Composite: `(user_id, dealership_id)` (unique)

## Future Enhancements

### Phase 2: Multiple Domains
Allow dealerships with multiple email domains (acquisitions, franchises).

**Implementation:**
```sql
CREATE TABLE dealership_allowed_domains (
  dealership_id UUID,
  domain VARCHAR(255),
  PRIMARY KEY (dealership_id, domain)
);
```

### Phase 3: SSO Integration
Support enterprise login (Google Workspace, Microsoft 365).

**Changes:**
- Add `sso_provider` field
- Skip password creation
- OAuth callback handling

### Phase 4: Role Permissions
Granular feature-level access control.

**Example:**
```typescript
const permissions = {
  sales: ['view_listings', 'edit_listings', 'view_messages'],
  manager: ['view_analytics', 'manage_team', ...salesPermissions],
  admin: ['all_features']
};
```

### Phase 5: Activity Logging
Track invitation lifecycle events.

**Events:**
- Invitation sent
- Email opened (tracking pixel)
- Link clicked
- Setup completed
- Invitation revoked

## Testing Checklist

- [ ] Domain validation rejects non-matching emails
- [ ] Duplicate invitation blocked
- [ ] Email already active blocked
- [ ] Token validation works
- [ ] Token expiration enforced
- [ ] Password validation (min length)
- [ ] Password confirmation match
- [ ] Success redirect to login
- [ ] Revoke cancels pending invite
- [ ] Resend works for valid invites
- [ ] UI shows invited status badge
- [ ] Mobile responsive design
- [ ] Accessibility (screen readers)

## Migration from Mock to Production

1. **Email Service:**
   Replace mock email function with real provider (SendGrid, AWS SES, Postmark).

2. **Database:**
   Run migration:
   ```bash
   psql -f src/lib/db/schema-team-invites.sql
   ```

3. **Password Hashing:**
   Implement proper password hashing (bcrypt, argon2):
   ```typescript
   import bcrypt from 'bcrypt';
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

4. **Token Storage:**
   Move from in-memory Map to database queries.

5. **User Account Creation:**
   Integrate with actual auth system (Supabase, Auth0, custom).

## Support

For questions or issues:
- **In-app:** Settings → Ask Carly
- **Email:** support@carly.com
- **Docs:** /help-center

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready (with mock data)
