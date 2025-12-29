# Carly Appointments System

## Overview

The **Appointments** system replaces the legacy "Test Drives" feature and serves as the **primary reputation signal generator** in the Carly platform. It implements a finite state machine workflow where every buyer-seller interaction creates immutable event logs that feed into Carly's reputation algorithms.

---

## Core Principles

1. **Reputation-First Architecture** - Appointments exist to generate trust signals, not just schedule meetings
2. **Event Logs, Not Opinions** - Structured data (punctuality, completion, consistency) dominates over free-text reviews
3. **Finite State Machine** - Steps are locked once completed; all confirmations are mutual
4. **Individual vs Organization Separation** - Staff issues are isolated unless systemic thresholds are met
5. **Immutable History** - Every confirmation, delay, and revision is permanently logged

---

## Appointment Types

- **Test Drive** - Vehicle trial
- **Viewing** - In-person inspection
- **Inspection** - Professional evaluation
- **Paperwork** - Document review/signing
- **Delivery** - Vehicle handoff

---

## State Machine Workflow

### Step 1: Created
- **Trigger**: Buyer requests appointment
- **Status**: `pending_confirmation`
- **Reputation Signals**: 
  - Seller response time
  - Buyer request clarity

### Step 2: Confirmed
- **Trigger**: Both parties confirm
- **Status**: `confirmed`
- **Locked**: After both confirm
- **Reputation Signals**:
  - Response latency
  - Excessive rescheduling patterns

### Step 3: Arrived
- **Trigger**: Both parties check in
- **Status**: `in_progress`
- **Locked**: After both confirm arrival
- **Reputation Signals**:
  - Punctuality (±5min = 100, ±30min = 70)
  - No-show tracking

### Step 4: Activity Completed
- **Trigger**: Both parties confirm completion
- **Status**: `in_progress`
- **Locked**: After both confirm
- **Reputation Signals**:
  - Completion rate
  - Premature termination patterns

### Step 5: Outcome Declared (Blind)
- **Trigger**: Independent outcome selection
- **Status**: `completed` (after both declare)
- **Locked**: After reveal
- **Outcomes**: Interested / Not Interested / Needs Follow-up
- **Reputation Signals**:
  - Outcome mismatches logged as neutral signals
  - Patterns analyzed over time

### Step 6: Reviewed
- **Trigger**: Step-scoped review submission
- **Structured Ratings**: Punctuality, Professionalism, Communication, Accuracy (1-5)
- **Text**: Optional and de-weighted
- **Reputation Signals**:
  - Reviews influence micro-signals only
  - Aggregated patterns, not individual reviews

---

## Reputation Signal Types

| Signal Type | Weight | Target | Description |
|-------------|--------|--------|-------------|
| **response_time** | 0.8 (confirm), 0.5 (other) | Buyer/Seller | Time to first confirmation |
| **punctuality** | 1.0 | Both | Arrival timing vs scheduled |
| **completion_rate** | 1.0 (activity), 0.6 (other) | Both | Step completion success |
| **no_show** | 2.0 | No-show actor | Heavy penalty for pattern detection |
| **rescheduling** | 0.7 | Requester | Penalty increases with frequency |
| **professionalism** | 0.5 | Both | Derived from step reviews (secondary) |

---

## Integration with Reputation System

### Mapping to A-E Events
- **Confirmed** → `A_APPOINTMENT_CONFIRMED`
- **Activity Completed** → `B_TEST_DRIVE_CONFIRMED`

### Signal Aggregation
```typescript
// 90-day rolling window
{
  response_time_avg: number,      // 0-100
  punctuality_avg: number,         // 0-100
  completion_rate: number,         // 0-100
  no_show_count: number,           // Raw count
  rescheduling_frequency: number   // Ratio
}
```

### Consistency Score
```
score = (
  response_time_avg * 0.20 +
  punctuality_avg * 0.25 +
  completion_rate * 0.30
) - (no_show_penalty * 0.15) - (reschedule_penalty * 0.10)
```

### Pattern Anomaly Detection
- **Repeated No-Shows**: ≥3 in 90 days = High severity
- **Excessive Rescheduling**: >50% frequency = Medium severity
- **Poor Punctuality**: <60 avg over 5+ appointments = Low severity

### Staff Reputation Isolation
- Individual staff issues tracked separately
- **Escalation Threshold**: 
  - ≥3 distinct staff flagged, OR
  - Single staff with high severity + score <40
- Only escalate to dealership if systemic

---

## API Endpoints

### Create Appointment
```http
POST /api/appointments
{
  "listing_id": "uuid",
  "buyer_id": "uuid",
  "seller_id": "uuid",
  "seller_type": "dealer" | "buyer",
  "staff_id": "uuid",
  "appointment_type": "test_drive" | "viewing" | "inspection" | "paperwork" | "delivery",
  "proposed_datetime": "ISO8601",
  "location": "string"
}
```

### Confirm Step
```http
POST /api/appointments/{id}/confirm-step
{
  "step_type": "confirmed" | "arrived" | "activity_completed",
  "actor": "buyer" | "seller",
  "actor_id": "uuid"
}
```

### Declare Outcome (Blind)
```http
POST /api/appointments/{id}/outcome
{
  "outcome": "interested" | "not_interested" | "needs_followup",
  "actor": "buyer" | "seller",
  "actor_id": "uuid"
}
```

### Submit Review
```http
POST /api/appointments/{id}/review
{
  "reviewer_type": "buyer" | "seller",
  "reviewer_id": "uuid",
  "punctuality_rating": 1-5,
  "professionalism_rating": 1-5,
  "communication_rating": 1-5,
  "accuracy_rating": 1-5,
  "text_comment": "optional"
}
```

### Get Timeline
```http
GET /api/appointments/{id}/timeline
```

---

## UI Components

### Buyer View (`/buyer/appointments`)
- List of scheduled appointments
- Visual step timeline with confirmation indicators
- One-click step confirmation
- Locked step display
- Real-time status updates

### Dealer View (`/dealer/appointments`)
- List/Calendar toggle views
- Pending requests with confirm/decline
- Confirmed appointments with current step
- Staff assignment (if applicable)
- Reputation signal indicators (internal only)

---

## Security & Abuse Prevention

- Steps require mutual confirmation (no unilateral completion)
- Steps lock after completion (immutable)
- No-show requires reporting actor ID
- Outcome declarations are blind until both submit
- Review submission requires completed appointment

---

## Database Schema

```typescript
// Core tables
appointments
appointment_steps
step_events
step_reviews
outcome_declarations
reputation_signals

// Relationships
appointment → appointment_steps (1:N)
appointment → step_events (1:N)
appointment → step_reviews (1:N)
appointment → outcome_declarations (1:2)
appointment → reputation_signals (1:N)
```

---

## AWS Migration Notes

- All routes are stateless
- Background signal processing via async jobs
- Timeline queries optimized with indexes
- Reputation aggregation cached (15min TTL)
- Real-time updates via WebSocket (future)

---

## Testing

```bash
# Create test appointment
POST /api/appointments

# Confirm each step (buyer + seller)
POST /api/appointments/{id}/confirm-step

# Check timeline
GET /api/appointments/{id}/timeline

# Declare outcome
POST /api/appointments/{id}/outcome

# Submit review
POST /api/appointments/{id}/review
```

---

## Future Enhancements

- [ ] GPS-based arrival verification
- [ ] QR code check-in
- [ ] Push notifications for step confirmations
- [ ] Real-time chat during appointments
- [ ] Video appointment support
- [ ] Automated reminder system

---

**This system teaches users that behavior matters without turning Carly into a review battleground.**
