# Test Drive System - ARCHIVED

**Status:** ⚠️ ARCHIVED - December 2024  
**Replaced By:** Unified Appointment System (`@/lib/appointments/*`)

---

## Summary

The legacy Test Drive system has been **permanently retired** and replaced by the Unified Appointment workflow. Test drives are now created as appointments with `type: 'test_drive'`.

---

## What Changed

### ✅ Unified System (Current)

**Booking Flow:**
```typescript
// Create appointment with type 'test_drive'
appointmentsDb.createAppointment({
  type: 'test_drive',
  listing_id,
  buyer_id,
  seller_id,
  proposed_datetime,
  status: 'pending_confirmation',
  current_step: 'created'
})
```

**State Management:**
- 6-step mutual confirmation FSM
- Both buyer and dealer confirm each step
- Immutable timeline with event log
- Reputation signals generated at each step

**Visibility:**
- Appears immediately in Buyer Appointments page
- Appears immediately in Dealer Appointments page
- Single source of truth

---

### ❌ Legacy System (Archived)

**File:** `src/lib/api/test-drives.ts` - **DO NOT USE**

**Archived Logic:**
- `testDriveService.createRequest()` - Inactive
- `VALID_TRANSITIONS` FSM - Replaced
- In-memory store - Replaced by database
- Separate overlap detection - Unified

---

## Migration Summary

### Code Changes

1. **`src/lib/api/test-drives.ts`**
   - Marked as ARCHIVED
   - All exports disabled
   - Kept for historical reference only

2. **`src/app/listings/[id]/page.tsx`**
   - Replaced `testDriveService.createRequest()` with `appointmentsDb.createAppointment()`
   - System messages now reference "Appointment" not "Test Drive"

3. **`src/components/test-drive/TestDriveModal.tsx`**
   - Interface renamed to `AppointmentModalProps`
   - UI text updated: "Schedule Appointment"

4. **Navigation & UI**
   - Seller Nav: "Appointments" (was "Test Drives")
   - Buyer Profile: "Appointments" (was "Test Drives")
   - All CTAs: "Book Appointment" (was "Request Test Drive")

5. **Help Center & Marketing**
   - "Can I book an appointment?" (was "test drive")
   - "Schedule appointments" (was "test drives or viewings")

6. **Storyboards**
   - All mock flows updated to use "Appointment" terminology
   - Handler renamed: `handleBookAppointment` (was `handleBookTestDrive`)

---

## Why This Change Was Made

### Problems with Dual Systems:

❌ Parallel scheduling logic  
❌ Duplicate overlap detection  
❌ "Why isn't this in my appointments?" confusion  
❌ Two separate FSMs  
❌ No reputation integration  

### Benefits of Unified System:

✅ Single source of truth  
✅ Type-based architecture (`type: 'test_drive'`)  
✅ Reputation-first design  
✅ Mutual confirmation workflow  
✅ Timeline-based accountability  
✅ Multi-purpose (test drives, viewings, inspections, paperwork)  

---

## For Developers

### ✅ DO:
- Use `@/lib/appointments/db` for all scheduling
- Create appointments with `type: 'test_drive'`
- Use appointment FSM from `@/lib/appointments/state-machine`
- Reference "appointments" in UI and messaging

### ❌ DO NOT:
- Import from `@/lib/api/test-drives.ts`
- Call `testDriveService.*` methods
- Create separate "test drive request" entities
- Use legacy `VALID_TRANSITIONS` FSM

---

## Backward Compatibility

**Legacy data:** If old test drive records exist, they must be:
- Migrated to appointments table, OR
- Displayed as read-only historical records

**No new test drive records may be created.**

---

## Related Documentation

- `docs/_archived/TESTDRIVE_APPOINTMENTS_UNIFICATION.md` - Initial unification
- `docs/appointments/APPOINTMENTS_SYSTEM.md` - Current system architecture
- `src/lib/appointments/db.ts` - Appointment database layer
- `src/lib/appointments/state-machine.ts` - Step-based FSM

---

**Archived By:** System Refactor - December 2024  
**Reason:** Replaced by unified appointment-based workflow
