# Carly Reputation System v1

## Overview

Carly's Reputation System is a **process-based trust scoring system** that emphasizes **verified interactions** over traditional rating aggregation. It provides dealers with a fair, explainable, and future-proof reputation score that rewards consistent execution.

## Core Principles

1. **Carly Verified Scoring is PRIMARY** - Process reliability (A→E stages) is the main authority
2. **Google Rating is SOFT BASELINE** - Never disqualifying, diminishes as Carly data grows
3. **User Reviews = Secondary** - Only allowed after verified interactions
4. **Individual ≠ Dealership** - Staff issues don't tank dealer reputation unless systemic
5. **No Scraping** - Google Places API only for external data
6. **Conservative & Explainable** - All scoring is bounded, weighted, and auditable

---

## Architecture

### Data Model

```
dealerships
  ├─ staff_members
  ├─ interaction_events (A-E spine)
  ├─ reviews (linked to events)
  ├─ issues (post-delivery problems)
  ├─ external_rating_snapshots (Google)
  ├─ reputation_scores (computed)
  └─ staff_reputation_scores (computed)
```

### Verified Interaction Events (A–E)

| Stage | Event | Verification Method |
|-------|-------|---------------------|
| **A** | Appointment Confirmed | Double-confirm, System Log |
| **B** | Test Drive Confirmed | System Log, Document Proof |
| **C** | Finance Session Confirmed | Document Proof |
| **D** | Purchase Confirmed | Document Proof |
| **E** | Delivery Confirmed | System Log, Document Proof |

---

## Scoring Algorithm

### Final Score Formula

```
Final = w_google * G + w_process * P + w_sentiment * S + R + V
```

Where:
- **G** = Google Score (0-100)
- **P** = Process Score (0-100) - PRIMARY AUTHORITY
- **S** = Sentiment Score (0-100) from user reviews
- **R** = Resolution Overlay (-25 to +10)
- **V** = Variance Overlay (-10 to +5)

### 1. Google Score (G)

```typescript
G_raw = ((google_rating - 1) / 4) * 100
confidence = 1 - exp(-review_count / 50)
G = G_raw * confidence
```

- Converts 1-5 Google rating to 0-100
- Dampens low review counts
- If no Google data: G = null, weight redistributes

### 2. Process Score (P) - PRIMARY

```typescript
P = 100 * (
  0.20 * P_A +  // Appointment reliability
  0.20 * P_B +  // Test drive follow-through
  0.15 * P_C +  // Finance engagement
  0.10 * P_D +  // Purchase conversion
  0.35 * P_E    // Delivery success (highest weight)
)
```

Stage rates:
```typescript
P_A = A_count / scheduled (or 1 if confirmed)
P_B = B_count / A_count
P_C = C_count / B_count
P_D = D_count / C_count
P_E = E_count / D_count
```

### 3. Sentiment Score (S)

Per-review weighting:
```typescript
depthWeight = { A:0.20, B:0.35, C:0.55, D:0.75, E:1.00 }
timeWeight = exp(-days_since / 180)  // 6-month half-life

stars_0_100 = ((stars - 1) / 4) * 100
S_review = stars_0_100 * depthWeight * timeWeight

S = weighted_average(S_review)
```

**Isolation Logic:**
- If `complaint_scope = INDIVIDUAL` and NOT systemic:
  - Dealership score uses at 25% weight
  - Staff score uses at 100% weight

**Systemic Threshold:**
- Triggers when:
  - ≥3 distinct staff flagged (90 days), OR
  - ≥8 individual negative reviews overall (stars ≤2)

### 4. Resolution Overlay (R)

```typescript
issue_rate = issues_count / E_count
resolved_rate = resolved_issues / issues_count
median_resolution_days = median(resolution times)

basePenalty = clamp(issue_rate * 30, 0, 20)
unresolvedPenalty = clamp((1 - resolved_rate) * 15, 0, 15)
speedBonus = (resolved_rate > 0.7 && median_days < 7) ? 5 : 0

R = clamp(-(basePenalty + unresolvedPenalty) + speedBonus, -25, +10)
```

### 5. Variance Overlay (V)

```typescript
volatility = stddev(monthly_scores_last_6mo)

if (volatility > 15): V = -8 to -10
else if (volatility < 5 && avg > 75): V = +2 to +5
else: V ≈ 0

V bounded: [-10, +5]
```

### 6. Dynamic Weighting

```typescript
n_verified = verified_events_last_12mo

w_carly = clamp(n_verified / 50, 0.20, 0.75)
w_google = clamp(1 - w_carly, 0.15, 0.35)

w_process = 0.65 * w_carly
w_sentiment = 0.35 * w_carly
```

**Null handling:**
- If G is null: redistribute w_google into w_process/w_sentiment
- If S is null: redistribute w_sentiment into w_process

### 7. Stars Conversion

```typescript
Final clamped: [0, 100]
stars = 1 + 4 * (Final / 100)
stars clamped: [1.0, 5.0]
```

### 8. Confidence Level

```typescript
if (n_verified >= 50): HIGH
else if (n_verified >= 10): MED
else: LOW
```

---

## API Endpoints

### Record Interaction Event
```http
POST /api/reputation/events/record
{
  "dealershipId": "uuid",
  "staffId": "uuid",
  "userId": "uuid",
  "eventType": "A_APPOINTMENT_CONFIRMED",
  "verificationMethod": "DOUBLE_CONFIRM",
  "metadata": {}
}
```

### Create Review (Verified Only)
```http
POST /api/reputation/reviews
{
  "dealershipId": "uuid",
  "staffId": "uuid",
  "userId": "uuid",
  "linkedInteractionEventId": "uuid",
  "stars": 5,
  "text": "Great experience!",
  "complaintScope": "PROCESS",
  "tags": ["professional", "transparent"]
}
```

### Sync Google Places Data
```http
POST /api/reputation/google/sync
{
  "dealershipId": "uuid"
}
```

### Get Reputation Score
```http
GET /api/reputation/score?dealershipId=uuid
```

### Recompute Scores (Cron-friendly)
```http
POST /api/reputation/recompute
{
  "dealershipId": "uuid"  // optional, recomputes all if omitted
}
```

---

## Usage

### 1. Seed Test Data
```bash
npx tsx scripts/seed-reputation.ts
```

### 2. View in Dealer Portal
Navigate to `/dealer/reputation` to see:
- Final star rating
- Google baseline vs Carly verified score
- Trust signals (response reliability, follow-through, delivery success)
- Issue resolution metrics
- Recent reviews with verification stages
- Team insights (internal staff scores)

### 3. Trigger Recompute
Scores auto-recompute on:
- New interaction event
- New review
- Issue created/resolved
- Google snapshot sync

Or manually:
```typescript
import { recomputeDealershipScore } from '@/lib/reputation/recompute';
await recomputeDealershipScore(dealershipId);
```

---

## Testing

```bash
npm test src/lib/reputation/__tests__/scoring.test.ts
```

Tests cover:
- Google confidence dampener
- Process score stage rates
- Dynamic weight behavior
- Systemic pattern detection
- Overlay bounding
- Score/star clamping

---

## Environment Variables

```env
GOOGLE_PLACES_API_KEY=your_key_here
```

---

## AWS Migration Notes

- All routes are stateless
- DB operations use abstract `reputationDb` interface (swap for Prisma/Supabase)
- Recompute endpoint safe for batching (limit=25)
- Cron-friendly: call `/api/reputation/recompute` nightly

---

## Abuse Prevention

- Reviews require verified event link
- 1 review per user per event
- Low ratings (≤2 stars) require reason tags
- Rate limiting on review submissions
- Audit metadata stored

---

## Future Enhancements

- [ ] Photo/video upload for reviews
- [ ] Dealer response to reviews
- [ ] Multi-platform sync (Facebook, Yelp)
- [ ] Real-time notification on flag threshold
- [ ] Machine learning fraud detection
- [ ] Public-facing reputation page

---

## Support

For questions or issues:
1. Check `ARCHITECTURE.md` for system design
2. Review `scoring.ts` for algorithm details
3. Test with seed script before production deployment
