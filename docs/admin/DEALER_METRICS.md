# Dealer Metrics Dashboard

## Overview

The Dealer Metrics Dashboard provides admin-only oversight of all onboarded dealers with comprehensive performance tracking. This is a **READ-ONLY** system focused on platform governance.

## Key Questions Answered

1. **Who should we keep?** - High activity, good engagement, responsive dealers
2. **Who should we watch?** - Declining activity, low completion rates, unread messages piling up
3. **Who is hurting trust?** - High cancellation rates, no recent activity, poor responsiveness

## Architecture

### Database Layer

**Schema:** `src/lib/db/schema-admin.sql`

- **View: `dealer_metrics`** - Aggregated metrics for all dealers
- **Function: `get_dealer_detail_metrics()`** - Detailed metrics for specific dealer
- **RLS Policies:** Admin-only access enforced at database level

**Metrics Tracked:**
- Listing counts (total, active, sold, deleted)
- Engagement (conversations, messages sent/received)
- Appointments (scheduled, completed, cancelled)
- Recent activity (7-day windows)
- Last activity timestamp

### API Layer

**File:** `src/lib/api/admin-dealers.ts`

**Functions:**
- `getDealerOverview()` - Fetch all dealer metrics
- `getDealerDetailMetrics(dealerId)` - Fetch single dealer metrics
- `getDealerListings(dealerId)` - Fetch dealer's listings
- `getDealerConversations(dealerId)` - Fetch dealer's conversations
- `getDealerAppointments(dealerId)` - Fetch dealer's appointments

All functions query via Supabase with RLS enforcement.

### UI Layer

**Dealer Overview:** `/admin/dealers`
- Platform summary (total dealers, active listings, messages, inactive count)
- Dealer table with sortable metrics
- Activity indicators (color-coded by recency)
- Click-through to detail view

**Dealer Detail:** `/admin/dealers/[id]`
- Comprehensive dealer profile
- Key metrics grid (listings, conversations, appointments, last activity)
- Performance indicators (7-day activity, engagement rate, completion rate)
- Recent listings table
- Recent conversations table
- Recent appointments table

## Security

### Middleware Enforcement

Admin routes (`/admin/*`) blocked for non-admins in `middleware.ts`:
```typescript
if (pathname.startsWith('/admin')) {
  if (!session || session.user.user_metadata?.is_admin !== true) {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
```

### Database RLS

All tables enforce admin-only SELECT via JWT claim:
```sql
(auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
```

### No Mutations

Current implementation is **READ-ONLY**. No update, delete, or action buttons.

## Governance Framework

### Activity Levels

- **Today/Yesterday** - ✅ Active (green)
- **< 7 days** - 🔵 Recent (blue)
- **< 30 days** - ⚠️ Cooling (yellow)
- **> 30 days** - 🔴 Inactive (red, flagged in summary)

### Performance Indicators

**Engagement Rate:**
```
messages_sent / total_conversations * 100
```

**Appointment Completion Rate:**
```
completed_appointments / total_appointments * 100
```

### Warning Signals

- Unread messages > 0 (highlighted in red badge)
- Last activity > 30 days (counted in "Inactive Dealers" metric)
- High cancellation rate vs. completed appointments
- Zero recent activity in 7-day window

## Usage

### For Platform Admins

1. Navigate to `/admin/dashboard`
2. Click "Dealer Metrics" card
3. Review platform summary for red flags
4. Scan dealer table for inactive or problematic dealers
5. Click any dealer row to view detailed breakdown
6. Analyze recent activity, engagement, and appointment performance

### For Development

**Migration Required:**
```bash
psql $DATABASE_URL -f src/lib/db/schema-admin.sql
```

**Test Data:**
Requires existing data in:
- `users` table (role = 'dealer')
- `listings` table (with dealer_id references)
- `conversations` table (with dealer_id references)
- `messages` table (linked to conversations)
- `appointments` table (with dealer_id references)

## Future Enhancements

### Phase 2: Actions
- Approve/reject dealer applications
- Suspend/unsuspend dealer accounts
- Send warnings or notifications
- Flag for review

### Phase 3: Analytics
- Time-series charts (activity over time)
- Cohort analysis (dealer performance by onboard date)
- Predictive alerts (dealers likely to churn)

### Phase 4: Advanced Metrics
- Revenue tracking (when payment system added)
- Customer satisfaction scores
- Response time averages
- Conversion funnel metrics

## Files Created

```
src/lib/db/schema-admin.sql (updated)
  - dealer_metrics view
  - get_dealer_detail_metrics() function
  - RLS policies

src/lib/api/admin-dealers.ts (new)
  - API functions for metrics

src/app/admin/dealers/page.tsx (new)
  - Overview page

src/app/admin/dealers/[id]/page.tsx (new)
  - Detail page

src/app/admin/dashboard/page.tsx (updated)
  - Added link to dealer metrics

docs/admin/DEALER_METRICS.md (new)
  - This file
```

## Status

**Implementation:** ✅ Complete
**Database Migration:** ⚠️ Required
**Test Data:** ⚠️ Needed for full functionality
**Production Ready:** ⚠️ After migration + testing

## Support

For issues:
1. Verify admin flag: `user_metadata.is_admin = true`
2. Check database migration ran successfully
3. Verify test data exists in required tables
4. Review middleware logs for access blocks
5. Test RLS policies with SQL queries
