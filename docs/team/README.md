# Team Management Documentation

## Overview

Documentation for dealer team management features, including member invitations, access control, and role-based permissions.

## Contents

- [TEAM_INVITATION_SYSTEM.md](./TEAM_INVITATION_SYSTEM.md) — Email-based team member onboarding with domain enforcement

## Quick Reference

### Add Team Member Flow

1. Dealer goes to **Settings → Team**
2. Clicks **"Add Member"**
3. Enters email (must match dealership domain)
4. Selects role (Sales / Manager / Admin)
5. Clicks **"Send Invitation"**
6. Team member receives email
7. Clicks link → Sets up account
8. Account activated → Can login

### Key Security Features

- ✅ Domain enforcement
- ✅ Single-use tokens
- ✅ 72-hour expiration
- ✅ No password sharing
- ✅ Email verification required
- ✅ Duplicate prevention

### Status Badges

| Badge | Meaning |
|-------|---------|
| 🟢 **Active** | Fully onboarded, can login |
| 🟡 **Invited** | Email sent, awaiting setup |

### Available Roles

| Role | Permissions |
|------|-------------|
| **Sales** | Manage listings, view/send messages |
| **Manager** | + View analytics, manage test drives |
| **Admin** | + Full access, invite team members |
| **Owner** | + Billing, dealership settings |

---

For implementation details, see [TEAM_INVITATION_SYSTEM.md](./TEAM_INVITATION_SYSTEM.md).
