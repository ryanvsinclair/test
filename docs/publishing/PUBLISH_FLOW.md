# PUBLISH TO MARKETPLACE FLOW

## Overview
Step-based wizard with full road readiness state enforcement for publishing vehicles from My Garage to marketplace.

---

## Flow Structure

### 5-Step Wizard with Progress Indicators

1. **Vehicle Condition** - Running, drivable, legally operable status
2. **Inspection & Documentation** - Upload or confirm unavailable
3. **Known Issues Disclosure** - Severity and description
4. **Final State Review** - Auto-assigned category (read-only)
5. **User Acknowledgement** - Mandatory confirmation

**Users may not skip steps**

---

## Step Details

### Step 1: Vehicle Condition

**Required Inputs:**
- Is the vehicle currently running? (yes/no)
- Is the vehicle drivable today? (yes/no)
- Is the vehicle legally operable on public roads? (yes/no)

**Inline Explanations:**
- "If the vehicle is not running, it cannot be Road Ready."
- "If the vehicle is not drivable, it will be classified as Builder's Market."

### Step 2: Inspection & Documentation

**Options:**
- Upload inspection document (PDF/image, drag & drop)
- Confirm inspection pending/unavailable

**Validation:**
- `inspection_status`: 'verified' | 'uploaded' | 'none'

**Warning if skipped:**
> "Without an inspection, your vehicle cannot be listed as Road Ready."

### Step 3: Known Issues Disclosure

**Severity Selection (required):**
- No known issues
- Minor issues (cosmetic, wear items, small repairs)
- Major issues (engine, transmission, frame, electrical, safety)

**If major issues:**
> ⚠️ "Vehicles with major issues are listed under Builder's Market and are not considered road ready."

**Description required** for any issue (minor or major)

### Step 4: Final State Review (Read-Only)

**Summary Card Shows:**
- Running: Yes / No
- Inspection: Verified / Uploaded / None
- Issue severity: None / Minor / Major
- **Assigned Marketplace State:** road_ready | near_road_ready | builders_market

**Explanation Includes:**
- WHY this state was assigned
- WHAT changes would reach higher state
- What this means (ranking, test drives, visibility)

**Users cannot override assigned state**

### Step 5: User Acknowledgement (Mandatory)

**Required Checkbox:**

> "I confirm that all information provided is accurate and complete. I understand that providing false or misleading information may result in listing removal, account suspension, or permanent account termination."

- Publish button **disabled until checked**
- Stores `acknowledgement_timestamp` and `user_id`

---

## State Assignment Logic

```typescript
function assignRoadReadinessState(data: PublishFlowData): RoadReadinessState {
  // Builder's Market if:
  // - Not running
  // - Not drivable
  // - Not legally operable
  // - Major issues
  if (!running || !drivable || !legallyOperable || issueSeverity === 'major') {
    return 'builders_market';
  }
  
  // Road Ready if:
  // - Running, drivable, legally operable
  // - Has inspection (verified or uploaded)
  // - No issues or minor only
  if (running && drivable && legallyOperable && hasInspection && issueSeverity <= 'minor') {
    return 'road_ready';
  }
  
  // Near Road Ready (default)
  return 'near_road_ready';
}
```

**Server-side only, cannot be overridden**

---

## Database Schema

### vehicle_publish_logs
```sql
CREATE TABLE vehicle_publish_logs (
  id UUID PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Step 1
  is_running BOOLEAN NOT NULL,
  is_drivable BOOLEAN NOT NULL,
  is_legally_operable BOOLEAN NOT NULL,
  
  -- Step 2
  inspection_status TEXT NOT NULL,
  inspection_file_url TEXT,
  
  -- Step 3
  issue_severity TEXT NOT NULL,
  issue_description TEXT,
  
  -- Step 4
  assigned_road_readiness_state TEXT NOT NULL,
  
  -- Step 5
  acknowledgement_confirmed BOOLEAN NOT NULL,
  acknowledgement_timestamp TIMESTAMPTZ NOT NULL,
  
  -- Audit
  published_at TIMESTAMPTZ DEFAULT NOW(),
  user_ip_address TEXT,
  user_agent TEXT
);
```

### Enforcement Triggers

1. **validate_publish_flow_completeness()** - All steps required
2. **require_publish_log_before_listing()** - Cannot list without log
3. **lock_condition_fields_after_publish()** - Prevents edits without review

---

## Publishing Rules

**On Publish:**
1. Persist `road_readiness_state` as single authoritative field
2. Lock condition-related fields from editing
3. Log metadata for moderation (IP, user agent, timestamp)
4. Create audit trail in `vehicle_publish_logs`

**Post-Publish Edits:**
- Condition changes require re-review
- Must submit `vehicle_condition_update_requests`
- Admin approval required

---

## Marketplace Behavior After Publish

### Listing Display:
- Appears in unified marketplace
- Filtered by `road_readiness_state`
- Badge shown on all views

### Builder's Market Restrictions:
- ❌ No test drive requests
- ❌ No financing options
- ⚠️ Prominent disclosure banners
- 🔒 Only visible when filter enabled

---

## API Endpoint

### POST /api/publish/vehicle

**Request:**
```json
{
  "vehicleId": "uuid",
  "flowData": {
    "isRunning": true,
    "isDrivable": true,
    "isLegallyOperable": true,
    "inspectionStatus": "uploaded",
    "inspectionFile": File,
    "issueSeverity": "minor",
    "issueDescription": "Brake pads need replacement",
    "acknowledgementConfirmed": true,
    "acknowledgementTimestamp": "2024-12-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "vehicleId": "uuid",
  "assignedState": "near_road_ready",
  "message": "Vehicle successfully published as near road ready"
}
```

**Validation:**
- All steps completed
- Issue description if not "none"
- Acknowledgement confirmed
- Server assigns state (no override)

---

## Files Created

### Components:
1. `src/components/publish/PublishFlowWizard.tsx` - Main wizard container
2. `src/components/publish/steps/VehicleConditionStep.tsx` - Step 1
3. `src/components/publish/steps/InspectionStep.tsx` - Step 2
4. `src/components/publish/steps/IssuesDisclosureStep.tsx` - Step 3
5. `src/components/publish/steps/StateReviewStep.tsx` - Step 4
6. `src/components/publish/steps/AcknowledgementStep.tsx` - Step 5

### Logic:
7. `src/lib/publish/state-assignment.ts` - State determination & validation
8. `src/lib/db/schema-publish-flow.sql` - Database schema & triggers

### API:
9. `src/app/api/publish/vehicle/route.ts` - Publish endpoint

### Types:
10. `src/types/publish-flow.ts` - Flow data types

---

## Design Tone

**Calm, Informative, Non-Accusatory:**
- Focus on transparency and buyer protection
- Clear explanations without fear language
- No dark patterns
- Emphasize trust and safety

**Example Copy:**
> "Honest disclosure protects both you and buyers. It prevents disputes, builds trust, and helps buyers make confident decisions."

---

**Status:** Complete publish-to-marketplace flow with guided steps, automatic state assignment, and full enforcement.
