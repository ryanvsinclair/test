# Admin Documentation

This directory contains documentation for Carly's admin system.

## Overview

The admin system provides secure platform oversight and management capabilities. Admin access is capability-based (not role-based) and enforced entirely through middleware and database RLS policies.

## Documents

### [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)
Complete admin system implementation guide covering:
- Security architecture
- Middleware enforcement
- Database setup with RLS
- Admin user creation
- Testing procedures
- Threat model

## Quick Start

### For First-Time Setup

1. **Deploy Database Schema**
   ```bash
   # Run the admin schema migration
   psql $DATABASE_URL -f src/lib/db/schema-admin.sql
   ```

2. **Create Admin User**
   - Go to Supabase Dashboard → Authentication → Users
   - Select user to promote
   - Edit `user_metadata`, add: `{ "is_admin": true }`
   - Save

3. **Test Access**
   - Log in via `/auth/buyer` or `/auth/dealer`
   - Should auto-redirect to `/admin/dashboard`

### For Developers

- Admin routes: `/admin/*`
- Access control: Middleware only (single source of truth)
- UI location: `src/app/admin/`
- Database: `dealer_applications` table with admin-only RLS

## Security Rules

❌ **Never:**
- Create `/auth/admin` login page
- Set `is_admin` from client code
- Hardcode admin emails
- Add admin logic to UI components

✅ **Always:**
- Check `user_metadata.is_admin` in middleware
- Use RLS policies for database access
- Create admins via Supabase Dashboard
- Keep admin UI separate from buyer/dealer

## Support

For admin access issues:
1. Verify `is_admin` flag in Supabase Dashboard
2. Check middleware logs in browser console
3. Test RLS policies with SQL queries
4. Review [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) troubleshooting section
