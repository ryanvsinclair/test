⚠️ **ARCHIVED** — Retained for historical reference only. Do not use for current implementation.

---

# Carly Reputation Scoring v1.0 - Migration Guide

## Overview

This document outlines the migration from the existing reputation system (v0.x) to the new event-driven CarlyScore v1.0 engine.

**Status**: v1.0 implemented alongside v0.x - both systems operational during validation phase.

---

## What Changed

### 1. Architecture: Derived Metrics → Event Ledger

**Before (v0.x):**
- Reputation computed from aggregated tables (appointment counts, review averages, etc.)
- State-based calculation with inconsistent time windows
- No audit trail of reputation-affecting actions

**After (v1.0):**
- Immutable, append-only `reputation_event_ledger` as single source of truth
- All reputation math computed from raw events
- Full audit trail of every reputation-affecting action

**Files:**
- `src/lib/reputation/event-ledger.ts` - Event types and append/query functions
- Database schema: `reputation_event_ledger` table (to be created)

---

### 2. Scoring Engine: Process-Centric → Behavioral

**Before (v0.x):**
- Process Score (65% weight): Based on funnel stages A→B→C→D→E
- Google Score with confidence dampening
- Sentiment with time decay
- Resolution and volatility overlays

**After (v1.0):**
```
CarlyScore = 100 × (0.45 × B + 0.35 × R + 0.20 × T) × P

B (Behavior Quality):
  - Response speed (log-scaled median first reply time)
  - Conversation progression toward outcomes
  - Verified buyer sentiment only

R (Reliability):
  - Appointment follow-through
  - Dealer no-show penalties (buyer no-shows excluded)
  - Listing integrity (VIN mismatches, misleading edits)

T (Trust & Safety):
  - Severity-weighted disputes with exponential time decay
  
P (Penalty Multiplier):
  - Centralized final penalty for severe safety/integrity violations
```

**Files:**
- `src/lib/reputation/carly-score-v1.ts` - New scoring engine
- `src/lib/reputation/scoring.ts` - Legacy system (PRESERVED, not deleted)

---

### 3. Time Handling: Unified Decay Model

**Before (v0.x):**
- Inconsistent time windows (12 months, 6 months, 180 days)
- Different decay models per component

**After (v1.0):**
- Single exponential decay: `w(t) = e^(-λ × Δdays)`
- Half-life: 120 days (λ = ln(2)/120)
- Applied consistently across all components
- Dashboard views: filtered, no decay
- Insights views: filtered + light decay
- Reputation: always decayed, never reset

---

### 4. Cold-Start: Explicit Bayesian Priors

**Before (v0.x):**
- Implicit handling with confidence dampening
- No clear "building reputation" state

**After (v1.0):**
- Bayesian priors blend observed data until sufficient volume:
  - B_prior = 0.60
  - R_prior = 0.60
  - T_prior = 0.85
  - α = 30 virtual interactions
- Cold-start detection: < 10 verified interactions
- UI shows "Reputation building" with locked breakdowns

---

### 5. Agent vs Dealership Separation

**Before (v0.x):**
- Only dealership-level scores

**After (v1.0):**
- **Agent-level CarlyScore:** Same engine, filtered by `agentId`
- **Dealership score:** Volume-weighted aggregate with outlier dampening
- Outlier detection: Statistical threshold (agents < 60 score)
- Minor dealership dampening: max -10% if multiple outliers
- Internal coaching alerts generated for outlier agents

---

### 6. Google Integration

**Before (v0.x):**
- Google score as soft baseline with confidence dampening (15-35% weight)

**After (v1.0):**
- Google rating imported as **read-only soft context**
- **STRICT FALLBACK RULE (NEW):**
  - **WITHOUT Google connected:** `ReputationComposite = CarlyScore` (no penalty, no advantage)
  - **WITH Google connected:** `ReputationComposite = 75% CarlyScore + 15% Sentiment + 10% Google`
- Confidence-weighted neutral baseline when connected
- **Never dominates CarlyScore or ranking**
- UI clearly labels: "Google Business Profile not connected (optional)"

---

### 7. Public vs Internal Scores

**New in v1.0:**

**CarlyScore (0-100):** Internal ranking, eligibility, trust enforcement
- Drives platform decisions
- Full access to all events and penalties

**ReputationComposite (0-100):** Public-facing
- 75% CarlyScore
- 15% Verified sentiment
- 10% Google soft baseline

**Grade (A-E):** Mapped from CarlyScore with penalty caps
- Severe penalties (P < 0.7) cap grade at B even if score is A-range

---

### 8. Explainability (Non-Optional)

**New in v1.0:**

Every API response includes:
- Component breakdown (B, R, T, P)
- Positive/negative drivers
- Recent impactful events
- "Next best actions to improve score" (top 3)

This prevents black-box distrust and empowers dealers to improve.

---

## Migration Plan

### Phase 1: Parallel Implementation ✅ COMPLETE
- [x] Implement event ledger (`event-ledger.ts`)
- [x] Implement CarlyScore v1.0 engine (`carly-score-v1.ts`)
- [x] Create new API endpoint `/api/dealer/reputation-v1`
- [x] Preserve legacy system (`scoring.ts`, `/api/dealer/reputation`)

### Phase 2: Event Ledger Population (IN PROGRESS)
- [ ] Create `reputation_event_ledger` table in database
- [ ] Implement event appending in:
  - [ ] Messaging system (MESSAGE_SENT, MESSAGE_RECEIVED, MESSAGE_FIRST_REPLY)
  - [ ] Appointment system (APPOINTMENT_*, NO_SHOW_*)
  - [ ] Listing system (LISTING_CREATED, LISTING_EDIT, VIN validation)
  - [ ] Dispute system (DISPUTE_*, resolution tracking)
  - [ ] Deal completion (DEAL_COMPLETED, VERIFIED_REVIEW_SUBMITTED)
- [ ] Backfill historical events from existing data (where possible)

### Phase 3: Validation (NEXT)
- [ ] Run both systems in parallel for 30 days
- [ ] Compare outputs (CarlyScore v1.0 vs legacy score)
- [ ] Validate explainability with sample dealers
- [ ] Test cold-start behavior with new dealers
- [ ] Verify agent-level scoring accuracy

### Phase 4: UI Migration
- [ ] Update Reputation page to use v1 API
- [ ] Add component breakdown visualization (B, R, T)
- [ ] Display drivers and next best actions
- [ ] Show agent-level scores in dealership view
- [ ] Add "Reputation building" state for cold-start

### Phase 5: Cutover
- [ ] Switch ranking/eligibility systems to CarlyScore v1.0
- [ ] Redirect UI from `/api/dealer/reputation` → `/api/dealer/reputation-v1`
- [ ] Monitor for issues (30-day observation window)
- [ ] Deprecate legacy system (comment, do not delete)

### Phase 6: Cleanup (Future)
- [ ] Archive legacy system after 90 days of stable operation
- [ ] Document final architecture for future engineers

---

## API Compatibility

### Legacy API (v0.x) - PRESERVED
```
GET /api/dealer/reputation?dealershipId=<id>
```

Returns:
- `score.overallScore` (0-100)
- `score.grade` (A-E)
- `factors` (old process-based structure)
- `events` (derived, not from ledger)

### New API (v1.0)
```
GET /api/dealer/reputation-v1?dealershipId=<id>&includeAgents=true
```

Returns:
- `score.overallScore` (CarlyScore 0-100)
- `score.reputationComposite` (public score 0-100)
  - **If Google NOT connected:** equals CarlyScore
  - **If Google connected:** 75% CarlyScore + 15% Sentiment + 10% Google
- `score.googleConnected` (boolean)
- `score.grade` (A-E with penalty caps)
- `breakdown` (B, R, T components with descriptions)
- `events` (from event ledger, real)
- `drivers` (positive/negative)
- `nextBestActions` (top 3 improvement suggestions)
- `agents[]` (agent-level scores if requested)
- `metadata.googleConnected` (boolean)
- `metadata.compositeCalculation` (explains formula used)

---

## Database Schema (To Be Created)

```sql
CREATE TABLE reputation_event_ledger (
  id VARCHAR(255) PRIMARY KEY,
  dealership_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255),
  buyer_id VARCHAR(255),
  listing_id VARCHAR(255),
  conversation_id VARCHAR(255),
  appointment_id VARCHAR(255),
  type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  severity VARCHAR(20),
  INDEX idx_dealership (dealership_id, timestamp),
  INDEX idx_agent (agent_id, timestamp),
  INDEX idx_type (type, timestamp)
);
```

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/reputation/event-ledger.ts` | Event types, append/query | ✅ Implemented |
| `src/lib/reputation/carly-score-v1.ts` | CarlyScore v1.0 engine | ✅ Implemented |
| `src/app/api/dealer/reputation-v1/route.ts` | New API endpoint | ✅ Implemented |
| `src/lib/reputation/scoring.ts` | **Legacy system** | ⚠️ Preserved |
| `src/app/api/dealer/reputation/route.ts` | **Legacy API** | ⚠️ Preserved |
| `src/app/dealer/reputation/page.tsx` | UI (to be updated) | 📝 Phase 4 |

---

## Testing Checklist

- [ ] Event ledger append works correctly
- [ ] Event queries filter by dealership/agent
- [ ] CarlyScore calculation matches spec
- [ ] Bayesian priors blend correctly in cold-start
- [ ] Time decay applies exponentially with 120-day half-life
- [ ] Outlier agent detection works
- [ ] Dealership score dampening applies correctly
- [ ] Penalty multiplier caps grade appropriately
- [ ] ReputationComposite weights correctly (75/15/10)
- [ ] Explainability returns meaningful drivers/actions
- [ ] API returns valid JSON for all cases (cold-start, outliers, errors)

---

## Rollback Plan

If critical issues arise:
1. Revert UI to legacy API endpoint
2. Revert ranking/eligibility systems to legacy scoring
3. Keep event ledger running (continue appending events)
4. Investigate issues without downtime
5. Re-migrate when fixed

**No data loss:** Event ledger is append-only and decoupled.

---

## Questions / Issues

Contact: Engineering team
Document version: 1.0
Last updated: [Current date]
