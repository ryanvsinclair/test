# Test Drive → Appointments Unification

**Status:** ✅ COMPLETE - December 2024  
**See:** `TEST_DRIVE_SYSTEM_ARCHIVED.md` for current status

---

## Summary

Unified Test Drive requests and Appointments into a single appointment-based workflow. Test drives are now a **type** of appointment, not a separate system.

**IMPORTANT:** The Test Drive system has been fully archived. See `TEST_DRIVE_SYSTEM_ARCHIVED.md` for complete details.

---

## Changes Made

### 1. Core Request Flow (`src/app/listings/[id]/page.tsx`)
- ✅ Replaced `testDriveService.createRequest()` with `appointmentsDb.createAppointment()`
- ✅ All requests now create appointments with `type: 'test_drive'`
- ✅ Messaging integration preserved (system messages reference appointments)
- ✅ Removed import of deprecated `test-drives.ts`

### 2. API Routes (Already Existed)
- ✅ `GET /api/appointments` - Fetch by buyer/seller/staff
- ✅ `POST /api/appointments` - Create new appointment
- ✅ `GET /api/appointments/:id/timeline` - Timeline view
- ✅ `POST /api/appointments/:id/confirm-step` - Mutual confirmation FSM

### 3. UI Updates

**Modal Component (`src/components/test-drive/TestDriveModal.tsx`)**
- ✅ Renamed interface to `AppointmentModalProps`
- ✅ Modal title: "Schedule Appointment" (was "Schedule Test Drive")
- ✅ Button: "Request Appointment" (was "Request Test Drive")
- ✅ Success message: "Appointment Requested" (was "Test Drive Requested")
- ✅ Kept legacy `TestDriveModalProps` alias for backward compatibility

**Listing Page CTA (`src/app/listings/[id]/page.tsx`)**
- ✅ Button text: "Schedule Appointment" (was "Request Test Drive")
- ✅ Button text in sidebar: "Request Appointment" (was "Request Test Drive")

**Navigation (`src/components/navigation/seller-nav.tsx`)**
- ✅ Changed "Test Drives" → "Appointments"
- ✅ Route: `/seller/appointments` (was `/seller/test-drives`)

**Buyer Profile (`src/app/buyer/profile/page.tsx`)**
- ✅ Stat label: "Appointments" (was "Test Drives")

**Footer Links (`src/components/navigation/CarlyFooter.tsx`)**
- ✅ Already linked to `/buyer/appointments` (correct)

**Publish Flow (`src/components/publish/steps/StateReviewStep.tsx` & `StateConfirmation.tsx`)**
- ✅ "Buyers can schedule appointments" (was "request test drives")
- ✅ "Appointments available with disclaimer" (was "Test drives available")
- ✅ "No appointments available" (was "No test drives")

### 4. Legacy Deprecation (`src/lib/api/test-drives.ts`)
- ⚠️ Added deprecation comment at top of file
- ⚠️ File kept for backward compatibility only
- ⚠️ All new code must use `@/lib/appointments/*`

## Architecture

### Before
```
Test Drive Request → testDriveService.createRequest()
                  → In-memory store
                  → Custom FSM (VALID_TRANSITIONS)
                  → Messages integration
```

### After
```
Appointment Request → appointmentsDb.createAppointment()
                   → Unified database
                   → 6-step mutual confirmation FSM
                   → Reputation signals
                   → Messages integration
```

## Benefits

✅ **Single source of truth** - One scheduling system  
✅ **Type-based architecture** - Test drives are `type: 'test_drive'` appointments  
✅ **Reputation-first** - Every step generates trust signals  
✅ **Mutual confirmation** - Both parties must confirm each step  
✅ **Timeline-based** - Immutable event log for accountability  
✅ **Multi-purpose** - Same system handles test drives, viewings, inspections, paperwork  

## What's Next

- [ ] Migrate existing test drive records to appointments table
- [ ] Add appointment type filter to UI
- [ ] Dealer confirmation UI enhancements
- [ ] SMS/Email notifications for appointment lifecycle events
- [ ] Calendar view improvements

## Breaking Changes

⚠️ **None** - Legacy `TestDriveModalProps` alias preserved for backward compatibility
⚠️ **Route change** - Dealer nav now uses `/seller/appointments` instead of `/seller/test-drives`
