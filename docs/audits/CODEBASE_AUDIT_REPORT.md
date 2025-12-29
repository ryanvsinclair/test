# CODEBASE AUDIT REPORT
## Carly Automotive Marketplace Platform

**Date:** [Generated]  
**Audit Type:** Comprehensive System Inventory & Dead Code Analysis  
**Purpose:** Identify all features, dead code, orphaned functionality, and cleanup opportunities

---

## EXECUTIVE SUMMARY

### Platform Health Assessment

**Overall Status:** 🟡 **MODERATE** - Platform is functional but carries significant technical debt

**Key Findings:**
- ✅ **Core Features Live:** Browse, listings, dealer portal, appointments, reputation system
- ⚠️ **Mock Data Heavy:** Most features use mock data instead of database connections
- ❌ **No Database Connected:** All "TODO" comments reference missing database implementation
- ⚠️ **Auth System:** Uses mock authentication only (no Supabase integration)
- ⚠️ **Multiple Deprecated Systems:** Legacy code from previous implementations still present
- 📁 **Archived Pages:** Multiple abandoned landing page versions in `_archived_pages`

---

### Launch Readiness Assessment

🔴 **NOT PRODUCTION READY**

**Blockers:**
1. No database connected (all data is mock/in-memory)
2. No real authentication system
3. Payment processing not implemented
4. Email notifications feature-flagged/disabled
5. File uploads not connected to S3
6. Analytics events fire but nowhere to store them

**Estimated Work to Production:**
- Database connection + migrations: 2-3 weeks
- Auth integration (Supabase): 1 week
- S3 integration for uploads: 1 week
- Email notification system: 1 week
- Payment processing: 2-3 weeks
- **Total: 7-11 weeks minimum**

---

## PART 1 — MASTER FEATURE INVENTORY

| Feature / System | Description | User Role | Entry Point | Status | Dependencies | Risk | Recommendation |
|-----------------|-------------|-----------|-------------|---------|--------------|------|----------------|
| **BUYER FEATURES** |
| Landing Page | Home with match flow | Guest/Buyer | `/` | ✅ Live | Mock data | Low | Keep |
| Match Flow | Preference questionnaire | Guest/Buyer | `/` → "Start Match" | ✅ Live | localStorage | Low | Keep |
| Explore Marketplace | Browse without login | Guest | `/explore` | ✅ Live | Mock vehicles | Low | Keep |
| Browse Marketplace | Browse with auth | Buyer | `/buyer/browse` | ✅ Live | Mock vehicles, Auth | Medium | Keep |
| Road Readiness Filters | Filter by state (Carly Verified, The Hub, Builder's Market) | Buyer | `/buyer/browse` | ✅ Live | None | Low | Keep |
| Vehicle Detail View | Full listing details | All | `/listings/[id]` | ✅ Live | Mock data | Low | Keep |
| SEO Listing Routes | Country/region/city/slug routes | All | `/cars/[country]/...` | ✅ Live | Mock data, sitemap | Low | Keep |
| Test Drive Booking | Schedule test drives | Buyer | Listing detail page | ✅ Live | In-memory store | Medium | Keep, needs DB |
| Messaging Center | Buyer-dealer messaging | Buyer | `/buyer/messages` | ✅ Live | Mock conversations | Medium | Keep, needs DB |
| Saved Vehicles (Garage) | Save/manage vehicles | Buyer | `/buyer/garage` | ✅ Live | In-memory API | Medium | Keep, needs DB |
| Owned Vehicles | Add owned vehicles with VIN | Buyer | `/buyer/garage` | ✅ Live | Mock VIN decoder | Medium | Keep, needs real VIN API |
| Buyer Appointments | View/manage appointments | Buyer | `/buyer/appointments` | ✅ Live | Mock appointments | Medium | Keep, needs DB |
| Buyer Profile | Settings, notifications, privacy | Buyer | `/buyer/profile` | ⚠️ Partial | Mock preferences APIs | High | Complete implementation |
| Natural Language Search | "Cheap reliable car" search | Buyer | `/explore`, `/buyer/browse` | ✅ Live | NL parser | Low | Keep |
| Vehicle Filters | Price, make, model, etc. | Buyer | Browse pages | ✅ Live | None | Low | Keep |
| **DEALER FEATURES** |
| Dealer Dashboard | Analytics overview | Dealer | `/dealer` | ✅ Live | Mock API data | Medium | Keep, needs DB |
| Listings Management | CRUD for inventory | Dealer | `/dealer/listings` | ✅ Live | Mock listings | High | Keep, needs DB |
| Bulk Upload | CSV/photo upload | Dealer | `/dealer/listings` | ⚠️ Placeholder | Mock S3, not functional | High | Complete or remove UI |
| CARFAX Upload | Report upload/linking | Dealer | `/dealer/listings` | ⚠️ Placeholder | Mock S3, not functional | High | Complete or remove UI |
| Vehicle Command Modal | Quick edit listings | Dealer | Listings page | ✅ Live | Mock API | Medium | Keep, needs DB |
| Dealer Messages | Lead management | Dealer | `/dealer/messages` | ✅ Live | Mock leads | Medium | Keep, needs DB |
| Bulk Messaging | Template messages | Dealer | Messages page | ✅ Live | Mock API | Low | Keep |
| Client Intelligence Sidebar | Buyer insights | Dealer | Messages page | ✅ Live | Mock taste profiles | Medium | Keep, needs DB |
| Dealer Insights | Performance analytics | Dealer | `/dealer/insights` | ✅ Live | Mock analytics | Medium | Keep, needs DB |
| Dealer Reputation | CarlyScore display | Dealer | `/dealer/reputation` | ✅ Live | Reputation DB (mock) | Medium | Keep, needs DB |
| Dealer Appointments | Manage test drives | Dealer | `/dealer/appointments` | ✅ Live | Mock appointments | Medium | Keep, needs DB |
| Dealer Settings | Profile, team, branding | Dealer | `/dealer/settings` | ⚠️ Partial | Mock profile | Medium | Complete implementation |
| Dealer Branding | Custom banner/logo | Dealer | Settings page | ⚠️ Placeholder | Not connected | High | Complete or remove |
| **AUTH & SECURITY** |
| Buyer Auth | Login/signup | Buyer | `/auth/buyer` | ⚠️ Mock Only | Mock auth | 🔴 Critical | Must implement real auth |
| Dealer Auth | Login/signup | Dealer | `/auth/dealer` | ⚠️ Mock Only | Mock auth | 🔴 Critical | Must implement real auth |
| Dealer Application | Apply for dealer account | Guest | `/auth/dealer/apply` | ✅ Live | Form only, no backend | Medium | Complete backend |
| Dealer Pending Page | Post-application status | Dealer | `/auth/dealer/pending` | ✅ Live | Static page | Low | Keep |
| Password Reset | Reset via email | All | Profile settings | ❌ Not Functional | Auth API returns mock | High | Implement or remove UI |
| 2FA Setup | Two-factor auth | All | Profile settings | ❌ Not Functional | Auth API returns mock | High | Implement or remove UI |
| **MARKETPLACE SYSTEMS** |
| Road Readiness State | Carly Verified/Hub/Builder's | System | Throughout | ✅ Live | State assignment logic | Low | Keep |
| Publish Flow Wizard | Step-by-step listing creation | Seller/Dealer | Garage → Publish | ✅ Live | Publish API (mock) | Medium | Keep, needs DB |
| Marketplace Mode Selection | Choose listing type | Seller/Dealer | Publish flow | ✅ Live | None | Low | Keep |
| State Assignment Logic | Automatic classification | System | Publish flow | ✅ Live | Business rules | Low | Keep |
| Inspection Upload | Upload inspection docs | Seller/Dealer | Publish flow | ⚠️ UI Only | No S3 connection | High | Complete backend |
| As-Is Vehicles Section | Builder's market only | Buyer | `/as-is-vehicles` | ✅ Live | Filtered mock data | Low | Keep |
| **REPUTATION SYSTEM** |
| CarlyScore v1 | Dealer reputation scoring | System | Throughout | ✅ Live | Reputation DB (mock) | Medium | Keep, needs DB |
| Google Places Sync | Import Google reviews | System | API endpoint | ⚠️ Placeholder | No API key configured | High | Complete or disable |
| Event Ledger | Track reputation events | System | Background | ✅ Live | Mock DB | Medium | Keep, needs DB |
| Review System | Buyer reviews of dealers | Buyer | API only | ✅ Live | Mock DB | Medium | Keep, needs DB |
| Appointment Reputation Link | Link appointments → reputation | System | Appointment flow | ✅ Live | Integration complete | Low | Keep |
| **APPOINTMENTS SYSTEM** |
| Appointment State Machine | Status workflow | System | Background | ✅ Live | State logic | Low | Keep |
| Timeline Tracking | Step-by-step tracking | System | API endpoints | ✅ Live | Mock DB | Medium | Keep, needs DB |
| Outcome Declaration | Record deal outcomes | Dealer/Buyer | API endpoint | ✅ Live | Mock DB | Medium | Keep, needs DB |
| Step Reviews | Rate appointment quality | Dealer/Buyer | API endpoint | ✅ Live | Mock DB | Low | Keep, needs DB |
| Email Reminders | 24h + 2h reminders | System | ❌ Not Implemented | Feature-flagged | SES not configured | High | Implement or document as future |
| **ANALYTICS & TRACKING** |
| Analytics Event Tracking | Client-side events | System | Throughout | ✅ Live | In-memory store | Medium | Keep, needs DB |
| Dealer Insights Tracking | Performance metrics | System | Background | ✅ Live | Mock data | Medium | Keep, needs DB |
| Taste Learning | Buyer preference learning | System | Browse interactions | ✅ Live | localStorage | Low | Keep |
| Smart Sorting | Personalized ranking | System | Browse page | ⚠️ Placeholder UI | Not fully implemented | Medium | Complete or remove "Coming Soon" |
| **CONTENT PAGES** |
| Help Center | FAQ + support | All | `/help-center` | ✅ Live | Static content | Low | Keep |
| How Carly Works | Platform explanation | All | `/how-carly-works` | ✅ Live | Static content | Low | Keep |
| Meet Carly | About page | All | `/meet-carly` | ✅ Live | Static content | Low | Keep |
| Carly Verified Explainer | State explanation | All | `/carly-verified` | ✅ Live | Static content | Low | Keep |
| Ask Carly | Feature request form | All | `/ask` | ✅ Live | Form only, no backend | Low | Complete or keep as static |
| Luxury Early Access | Luxury tier signup | All | `/luxury` | ✅ Live | Form only, no backend | Low | Keep or remove |
| Trust & Safety | Policies | All | `/trust-and-safety` | ✅ Live | Static content | Low | Keep |
| Data Transparency | Data usage | All | `/data-transparency` | ✅ Live | Static content | Low | Keep |
| Accessibility | Accessibility statement | All | `/accessibility` | ✅ Live | Static content | Low | Keep |
| Privacy Policy | Legal | All | `/privacy-policy` | ✅ Live | Static content | Low | Keep |
| Terms of Use | Legal | All | `/terms-of-use` | ✅ Live | Static content | Low | Keep |
| Contact Carly | Contact form | All | `/contact-carly` | ✅ Live | Form only, no backend | Low | Complete or keep as static |
| Report Issue | Bug reporting | All | `/report-issue` | ✅ Live | Form only, no backend | Low | Complete or keep as static |
| Page Directory | Dev navigation | Dev | `/page-directory` | ✅ Live | Static list | Low | Remove before production |
| **ARCHIVED / ABANDONED** |
| Landing V1 | Old landing design | N/A | `_archived_pages/landing_v1` | ❌ Archived | None | None | Delete |
| Landing V2 | Old landing design | N/A | `_archived_pages/landing_v2` | ❌ Archived | None | None | Delete |
| Landing V3 | Old landing design | N/A | `_archived_pages/landing_v3` | ❌ Archived | None | None | Delete |
| Landing V4 | Old landing design | N/A | `_archived_pages/landing_v4` | ❌ Archived | None | None | Delete |
| Legacy Seller Portal | Old seller UI | N/A | Removed | ❌ Deleted | None | None | Confirmed removed |
| VIN Decoder (old) | Legacy VIN API | N/A | `src/lib/vin/decoder.ts` | ⚠️ Deprecated | NHTSA API | Medium | Mark as deprecated, keep for reference |

---

## PART 2 — ROUTE & ACCESS AUDIT

### Public Routes (No Auth Required)
| Route | Purpose | Reachable | Issues |
|-------|---------|-----------|--------|
| `/` | Landing page | ✅ Yes | None |
| `/explore` | Guest marketplace | ✅ Yes | None |
| `/listings/[id]` | Listing detail | ✅ Yes | None |
| `/cars/[country]/[region]/[city]/[slug]` | SEO listing route | ✅ Yes | Mock data only |
| `/as-is-vehicles` | Builder's market | ✅ Yes | None |
| `/as-is-vehicles/[id]` | Builder's market detail | ✅ Yes | None |
| `/luxury` | Luxury early access | ✅ Yes | Form has no backend |
| `/ask` | Feature requests | ✅ Yes | Form has no backend |
| `/help-center` | Support | ✅ Yes | None |
| `/how-carly-works` | Explainer | ✅ Yes | None |
| `/meet-carly` | About | ✅ Yes | None |
| `/carly-verified` | Explainer | ✅ Yes | None |
| `/trust-and-safety` | Policy | ✅ Yes | None |
| `/data-transparency` | Policy | ✅ Yes | None |
| `/accessibility` | Statement | ✅ Yes | None |
| `/privacy-policy` | Legal | ✅ Yes | None |
| `/terms-of-use` | Legal | ✅ Yes | None |
| `/contact-carly` | Contact form | ✅ Yes | Form has no backend |
| `/report-issue` | Issue form | ✅ Yes | Form has no backend |
| `/page-directory` | Dev tool | ✅ Yes | **Remove before production** |

### Auth Routes
| Route | Purpose | Reachable | Issues |
|-------|---------|-----------|--------|
| `/auth/buyer` | Buyer login/signup | ✅ Yes | Mock auth only |
| `/auth/dealer` | Dealer login | ✅ Yes | Mock auth only |
| `/auth/dealer/apply` | Dealer application | ✅ Yes | No backend processing |
| `/auth/dealer/pending` | Application pending | ✅ Yes | Static page |

### Buyer Routes (Auth Required)
| Route | Purpose | Reachable | Issues |
|-------|---------|-----------|--------|
| `/buyer` | Dashboard redirect | ✅ Yes | Redirects to browse |
| `/buyer/browse` | Browse marketplace | ✅ Yes | Mock data |
| `/buyer/garage` | Saved + owned vehicles | ✅ Yes | Mock APIs |
| `/buyer/messages` | Messaging center | ✅ Yes | Mock conversations |
| `/buyer/appointments` | Appointment list | ✅ Yes | Mock data |
| `/buyer/profile` | Settings | ✅ Yes | Mock APIs, incomplete |

### Dealer Routes (Auth Required)
| Route | Purpose | Reachable | Issues |
|-------|---------|-----------|--------|
| `/dealer` | Dashboard | ✅ Yes | Mock API data |
| `/dealer/listings` | Inventory management | ✅ Yes | Mock listings |
| `/dealer/messages` | Lead management | ✅ Yes | Mock leads |
| `/dealer/insights` | Analytics | ✅ Yes | Mock metrics |
| `/dealer/reputation` | CarlyScore | ✅ Yes | Mock reputation data |
| `/dealer/appointments` | Test drive management | ✅ Yes | Mock appointments |
| `/dealer/settings` | Profile settings | ✅ Yes | Mock profile, incomplete |

### API Routes

#### Public APIs
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/analytics/event` | POST | Track events | ✅ Functional | In-memory store |
| `/api/as-is-vehicles` | GET | List builder's market | ✅ Functional | Mock data |
| `/api/as-is-vehicles/acknowledgment` | POST | Acknowledge disclaimer | ✅ Functional | In-memory store |

#### Auth APIs
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/auth/password-reset` | POST | Reset password | ⚠️ Mock | Returns fake success |
| `/api/auth/2fa/enable` | POST | Enable 2FA | ⚠️ Mock | Returns fake QR code |
| `/api/auth/2fa/verify` | POST | Verify 2FA code | ⚠️ Mock | Returns fake success |
| `/api/auth/2fa/disable` | POST | Disable 2FA | ⚠️ Mock | Returns fake success |

#### Buyer APIs
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/messages` | GET | Get messages | ✅ Functional | In-memory store |
| `/api/messages/send` | POST | Send message | ✅ Functional | In-memory store |
| `/api/appointments` | GET/POST | Manage appointments | ✅ Functional | Mock DB |
| `/api/appointments/[id]/timeline` | GET | Get timeline | ✅ Functional | Mock DB |
| `/api/appointments/[id]/confirm-step` | POST | Confirm step | ✅ Functional | Mock DB |
| `/api/appointments/[id]/outcome` | POST/GET | Declare outcome | ✅ Functional | Mock DB |
| `/api/appointments/[id]/review` | POST/GET | Review appointment | ✅ Functional | Mock DB |

#### Dealer APIs
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/dealer/dashboard` | GET | Dashboard data | ✅ Functional | Mock data |
| `/api/dealer/listings` | GET/PATCH | Manage listings | ✅ Functional | Mock data |
| `/api/dealer/listings/counts` | GET | Status counts | ✅ Functional | Mock data |
| `/api/dealer/listings/bulk-upload` | POST | CSV upload | ⚠️ Placeholder | Returns mock validation |
| `/api/dealer/insights` | GET | Analytics | ✅ Functional | Mock data |
| `/api/dealer/reputation` | GET | CarlyScore | ✅ Functional | Mock DB |
| `/api/dealer/reputation-v1` | GET | Legacy endpoint | ⚠️ Deprecated | Use `/reputation` instead |
| `/api/dealer/photos/bulk-upload` | POST | Photo ZIP upload | ⚠️ Placeholder | No S3 connection |
| `/api/dealer/carfax/upload` | POST | Single CARFAX | ⚠️ Placeholder | No S3 connection |
| `/api/dealer/carfax/bulk-upload` | POST | Bulk CARFAX | ⚠️ Placeholder | No S3 connection |

#### Reputation APIs
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/reputation/score` | GET | Get reputation | ✅ Functional | Mock DB |
| `/api/reputation/reviews` | GET/POST | Reviews | ✅ Functional | Mock DB |
| `/api/reputation/events/record` | POST | Record event | ✅ Functional | Mock DB |
| `/api/reputation/google/sync` | POST | Sync Google data | ⚠️ Placeholder | No API key |
| `/api/reputation/recompute` | POST | Recalculate score | ✅ Functional | Mock DB |

#### Publishing APIs
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/publish/vehicle` | POST | Publish vehicle | ✅ Functional | Mock DB |
| `/api/upload/vehicle` | POST | Upload vehicle data | ✅ Functional | Mock DB |
| `/api/listings/create` | POST | Create listing | ✅ Functional | Mock DB |
| `/api/listings/reclassify` | POST | Reclassify state | ✅ Functional | Mock logic |

#### Settings APIs
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/notifications/preferences` | GET/PUT | Notification settings | ⚠️ Placeholder | Returns mock data |
| `/api/privacy/settings` | GET/PUT | Privacy settings | ⚠️ Placeholder | Returns mock data |

### Dead / Orphaned Routes
❌ **None identified** - All routes have UI access points

---

## PART 3 — UI & UX AUDIT

### Buttons / Actions That Do Nothing

#### Buyer Profile Page (`/buyer/profile`)
- ❌ **"Change Password"** → Opens modal, submits to mock API
- ❌ **"Enable 2FA"** → Opens modal, shows fake QR code
- ❌ **"Manage Sessions"** → Shows "Coming soon" message
- ⚠️ **"Save Profile Changes"** → Saves to mock API only

#### Dealer Settings Page (`/dealer/settings`)
- ⚠️ **All profile updates** → Save to mock API only
- ❌ **Custom branding upload** → No S3 connection

#### Dealer Listings Page (`/dealer/listings`)
- ❌ **"Bulk Upload"** → Opens dialog but doesn't actually upload
- ❌ **"CARFAX Upload"** → Opens dialog but doesn't connect to S3
- ❌ **"Duplicate Listing"** → Shows "TODO" notification

### "Coming Soon" Elements

#### Buyer Garage
- 🔜 **"Appraisal Value"** section disabled with "Coming Soon" badge
- 🔜 **"Nexus"** card (relationship scores) - "Coming Soon" badge
- 🔜 **"Your Saved Builds"** - "Coming Soon" badge

#### Buyer Browse
- 🔜 **"Smart Sorting Options"** - Greyed out with "Personalized sorting coming soon"

#### Dealer Insights
- 🔜 **"Charts coming soon"** placeholder in trends section

#### Buyer Profile
- 🔜 **"Multi-session management and revocation coming soon"** in security modal

### Conditional Rendering Issues
✅ **No broken conditionals identified** - All feature flags are explicit

### Mock Data in Production Paths
🔴 **CRITICAL** - Mock data is used throughout:

**Files Using Mock Data:**
- `src/lib/api/mock-data.ts` - Main vehicle dataset
- `src/lib/api/dealer-mock-data.ts` - Dealer profiles, leads, messages
- `src/lib/api/mock-listings.ts` - Listing generator
- All browse/explore pages
- All dealer dashboard pages
- All messaging interfaces

**Impact:** All user-facing data is fake

---

## PART 4 — FEATURE FLAG & CONDITION AUDIT

### Environment Variables / Flags
❌ **No feature flags found in codebase**

**Recommendation:** Add feature flag system for:
- Email notifications (currently hardcoded as disabled)
- Google Places sync (not configured)
- Payment processing (not implemented)
- S3 uploads (not connected)

### Boolean Guards

#### Email Notifications
**Location:** `TESTDRIVE_IMPLEMENTATION.md:80-81`
```markdown
NOT YET IMPLEMENTED:
- ⚠️ Email notifications (feature-flagged for future)
```
**Status:** Hardcoded as disabled in comments, no actual flag

#### Personalization Scoring
**Location:** `PREFERENCE_SCORING_MIGRATION.md:234-237`
```markdown
If issues arise post-deployment:
1. Feature flag: Add env var ENABLE_SERVER_SCORING=false
```
**Status:** Documented but not implemented

### Recommendations
1. Add `ENABLE_EMAIL_NOTIFICATIONS` flag
2. Add `ENABLE_GOOGLE_PLACES_SYNC` flag
3. Add `ENABLE_S3_UPLOADS` flag
4. Add `ENABLE_PERSONALIZED_SORTING` flag

---

## PART 5 — BACKEND & DATA CONSISTENCY

### Database Connection Status
🔴 **NO DATABASE CONNECTED**

**Evidence:**
- All API files have `// TODO: Replace with actual Prisma client`
- All CRUD operations use in-memory stores or mock data
- No `.env` file with database credentials
- No Prisma schema migrations applied

### Mock Data Layers

#### In-Memory Stores
| System | Storage | Persistence | Production Ready |
|--------|---------|-------------|------------------|
| Messages | `messageStore` Map | ❌ None | ❌ No |
| Appointments | `appointmentsDb` functions | ❌ None | ❌ No |
| Test Drives | `testDriveService` | ❌ None | ❌ No |
| Analytics | `analyticsStore` Map | ❌ None | ❌ No |
| Saved Vehicles | `savedVehiclesAPI` | ❌ None | ❌ No |
| Dealer Branding | `dealerBrandingStore` Map | ❌ None | ❌ No |

#### Mock Data Sources
- `src/lib/api/mock-data.ts` - 1134 vehicles
- `src/lib/api/dealer-mock-data.ts` - Profiles, leads, messages
- `src/lib/api/mock-listings.ts` - Listing generator

### Tables/Fields Never Accessed
⚠️ **Cannot audit** - No database exists

**When database is connected, audit:**
- `schema-as-is-vehicles.sql`
- `schema-auth.sql`
- `schema-listing-identification.sql`
- `schema-market-lanes.sql`
- `schema-marketplace-modes.sql`
- `schema-privacy-settings.sql`
- `schema-publish-flow.sql`
- `schema-road-readiness.sql`
- `schema.sql`

---

## PART 6 — SECURITY & AUTH AUDIT

### 🔴 CRITICAL SECURITY ISSUES

#### 1. Mock Authentication System
**Location:** `src/contexts/AuthContext.tsx:43-68`
```typescript
const login = async (email: string, password: string, role: "buyer" | "dealer") => {
  // For demo: Check if dealer login and assign approval status
  const mockUser: User = {
    id: Math.random().toString(36).substring(7), // ⚠️ INSECURE
    email,
    name: email.split("@")[0],
    role,
    verified: true, // ⚠️ ALWAYS TRUE
    createdAt: new Date().toISOString(),
    dealerStatus: role === "dealer" ? "approved" : undefined, // ⚠️ INSTANT APPROVAL
  };
  setUser(mockUser);
}
```

**Issues:**
- ✅ **No password verification** - Any password works
- ✅ **No user database** - User created on-the-fly
- ✅ **No session management** - Stored in React state only
- ✅ **Dealers instantly approved** - No manual review
- ✅ **Random user IDs** - Not persistent across sessions

**Impact:** 🔴 **CRITICAL** - Anyone can access any role

---

#### 2. Mock Password Reset
**Location:** `src/lib/auth/auth-provider.ts:36-49`
```typescript
export async function requestPasswordReset(email: string): Promise<void> {
  // TODO: Integrate with Supabase Auth
  // TEMPORARY: Return mock success
  return new Promise(resolve => setTimeout(resolve, 500));
}
```

**Issues:**
- ❌ No email sent
- ❌ No reset token generated
- ❌ Always returns success

**Impact:** 🟡 **Medium** - UI misleads users, but auth is already broken

---

#### 3. Mock 2FA
**Location:** `src/lib/auth/auth-provider.ts:139-168`
```typescript
export async function enable2FA(userId: string): Promise<{ qrCode: string; secret: string }> {
  // TEMPORARY: Return mock data
  return {
    qrCode: 'data:image/png;base64,mock-qr-code',
    secret: 'MOCKJBSWY3DPEHPK3PXP'
  };
}
```

**Issues:**
- ❌ Fake QR code
- ❌ No TOTP secret generation
- ❌ No verification enforced

**Impact:** 🟡 **Medium** - Security theater, gives false sense of protection

---

#### 4. No Role Checks on Sensitive Routes
**Location:** All `/dealer/*` routes

**Current Behavior:**
```typescript
// src/app/dealer/layout.tsx
export default function DealerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

**Issues:**
- ❌ No authentication check
- ❌ No dealer role verification
- ❌ Anyone can access dealer portal with mock auth

**Impact:** 🔴 **CRITICAL** - No access control

---

### Security Recommendations

**Phase 1: Immediate (Before Any Production Use)**
1. ❌ Implement real Supabase Auth integration
2. ❌ Add server-side auth checks on all API routes
3. ❌ Add role verification middleware
4. ❌ Remove mock auth completely
5. ❌ Add session management

**Phase 2: Before Public Launch**
1. Remove or disable password reset UI (until backend ready)
2. Remove or disable 2FA UI (until backend ready)
3. Add rate limiting on login attempts
4. Add CSRF protection
5. Add audit logging for dealer actions

---

## PART 7 — ANALYTICS & LOGGING AUDIT

### Analytics Events Fired

**Location:** `src/lib/analytics/client.ts`

| Event Type | Where Fired | Data Tracked | Storage | Issues |
|------------|-------------|--------------|---------|--------|
| `page_view` | Throughout | Path, referrer | In-memory | ⚠️ Not persisted |
| `listing_view` | Listing detail | Vehicle ID, filters | In-memory | ⚠️ Not persisted |
| `listing_click` | Browse/explore | Vehicle ID, position | In-memory | ⚠️ Not persisted |
| `filter_change` | Browse/explore | Filter criteria | In-memory | ⚠️ Not persisted |
| `search_query` | Search bar | Query text | In-memory | ⚠️ Not persisted |
| `save_vehicle` | Heart button | Vehicle ID | In-memory | ⚠️ Not persisted |
| `unsave_vehicle` | Heart button | Vehicle ID | In-memory | ⚠️ Not persisted |
| `test_drive_request` | Test drive modal | Vehicle ID, dealer ID | In-memory | ⚠️ Not persisted |
| `message_sent` | Messaging | Conversation ID | In-memory | ⚠️ Not persisted |

### Orphaned Events
❌ **None identified** - All events correspond to active features

### Noisy Events
⚠️ **`page_view`** - Fires on every navigation, may create high volume

### Events Tied to Removed Features
❌ **None identified**

### Storage Audit
**Location:** `src/app/api/analytics/event/route.ts:4-20`

```typescript
// Mock in-memory storage (replace with real database)
const analyticsStore = new Map<string, any>();
```

**Issues:**
- ❌ Data lost on server restart
- ❌ No aggregation possible
- ❌ No time-series analysis
- ❌ No export capability

---

## PART 8 — DEAD CODE & CLEANUP CANDIDATES

### Archived Pages (Safe to Delete)
📁 **Location:** `src/_archived_pages/`

| Folder | Contents | Size | Recommendation |
|--------|----------|------|----------------|
| `landing_v1` | Old landing page | 1 file | ✅ Delete |
| `landing_v2` | Old landing + match flow | 3 files | ✅ Delete |
| `landing_v3` | Another iteration | 3 files | ✅ Delete |
| `landing_v4` | Yet another iteration | 1 file | ✅ Delete |

**Total Files:** 8
**Action:** Delete entire `_archived_pages` folder

---

### Deprecated Files (Archive or Document)

#### 1. VIN Decoder (Legacy)
**Location:** `src/lib/vin/decoder.ts`
**Status:** ⚠️ Deprecated (comment in file)
**Contains:** NHTSA API integration, trim/package lookup
**Referenced By:** Garage page (VIN decode flow)
**Recommendation:** 
- Keep file for reference
- Add deprecation notice at top
- Document replacement path (use dealer VIN decoder instead)

#### 2. Legacy Ranking System
**Location:** `src/lib/ranking/legacyScoreListing.ts`
**Status:** Unclear if used
**Recommendation:** Audit usage, archive if unused

#### 3. Deprecated Reputation API
**Location:** `src/app/api/dealer/reputation-v1/route.ts`
**Comment:** `⚠️ DEPRECATED - Use /api/dealer/reputation for new implementations`
**Recommendation:** Mark with deprecation notice, keep for backward compatibility

---

### Unused Components (Not Rendered)

#### Storyboard Components
**Location:** `src/app/tempobook/storyboards/`
- `315b6b45-d9cd-4b87-9975-23d81899ff3a/page.tsx` - BuyerAppointmentsFlow
- `5f2dca69-77d6-4fe3-842a-8bab2dbb4fe4/page.tsx` - BuyerAppointmentFlowMock

**Status:** Used for Tempo canvas only
**Recommendation:** Keep (part of Tempo development workflow)

---

### Unused Utilities/Helpers

#### Search Module
**Location:** `src/lib/search/`
- `vehicle-filter.ts` - Used by browse pages ✅
- `nl-parser.ts` - Used by browse pages ✅

**Status:** All used
**Recommendation:** Keep

#### Messaging Hooks
**Location:** `src/lib/messaging/`
- `useWebSocket.ts` - WebSocket hook ⚠️ Not currently used
- `useNetworkStatus.ts` - Network status detection ⚠️ Not currently used
- `useMessagePolling.ts` - Polling fallback ⚠️ Not currently used

**Status:** Prepared for real-time messaging (not yet implemented)
**Recommendation:** Keep (infrastructure ready for future)

---

### Constants/Enums Replaced But Not Removed

#### Deprecated Marketplace Mode
**Location:** `src/types/index.ts:171`
```typescript
export type MarketplaceMode = 'road-ready' | 'near-road-ready' | 'builders-market'; 
// Deprecated - use RoadReadinessState
```

**Status:** ⚠️ Still referenced in some files
**Files Using It:**
- `src/lib/api/vehicle-upload.ts` (validation logic)
- `src/components/upload/MarketplaceModeSelection.tsx` (UI component)

**Recommendation:** 
- Keep for backward compatibility during migration
- Add runtime mapping to RoadReadinessState
- Document migration path

---

### Comments Referencing Abandoned Plans

**Examples:**
```typescript
// TODO: Replace with actual Prisma client when database is configured
// TODO: Replace with real API integration
// TODO: Implement form submission
// TODO: Upload to S3
// Mock data - will be replaced with real API calls
```

**Count:** 100+ instances across codebase

**Recommendation:**
- These are reminders, not dead code
- Keep until implemented
- Consider creating GitHub issues to track

---

## PART 9 — RISK & DEPENDENCY MAP

### Critical Systems (High Blast Radius)

```
┌─────────────────────────────────────────┐
│         AuthContext (Mock)              │
│  ┌─────────────────────────────────┐   │
│  │  ALL Protected Routes Depend    │   │
│  │  - /buyer/*                     │   │
│  │  - /dealer/*                    │   │
│  │  - Saved vehicles               │   │
│  │  - Messaging                    │   │
│  └─────────────────────────────────┘   │
│  Risk: 🔴 CRITICAL - No real auth       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Mock Data Layer                 │
│  ┌─────────────────────────────────┐   │
│  │  ALL Features Depend            │   │
│  │  - Browse/Explore               │   │
│  │  - Listings                     │   │
│  │  - Dealer Dashboard             │   │
│  │  - Analytics                    │   │
│  └─────────────────────────────────┘   │
│  Risk: 🔴 CRITICAL - No persistence     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│    Road Readiness State System          │
│  ┌─────────────────────────────────┐   │
│  │  Tightly Coupled To:            │   │
│  │  - Browse filters               │   │
│  │  - Publish flow                 │   │
│  │  - Listing badges               │   │
│  │  - State assignment logic       │   │
│  └─────────────────────────────────┘   │
│  Risk: 🟡 MEDIUM - Well abstracted      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Reputation System (CarlyScore)     │
│  ┌─────────────────────────────────┐   │
│  │  Depends On:                    │   │
│  │  - Event ledger                 │   │
│  │  - Review system                │   │
│  │  - Google Places (not connected)│   │
│  │  - Appointment outcomes         │   │
│  └─────────────────────────────────┘   │
│  Risk: 🟡 MEDIUM - Self-contained       │
└─────────────────────────────────────────┘
```

### Tightly Coupled Areas

#### 1. Browse/Explore Pages
**Dependencies:**
- Mock vehicle data
- Road readiness filters
- Natural language search
- Smart sorting (partially implemented)
- Auth context (for saved vehicles)
- Analytics tracking

**Blast Radius:** 🟡 Medium
**Risk:** Changes to mock data format break filtering

---

#### 2. Dealer Portal
**Dependencies:**
- Mock auth
- Mock listings API
- Mock leads/messages
- Mock analytics
- Reputation system
- Bulk upload placeholders (non-functional)

**Blast Radius:** 🔴 High
**Risk:** Entire dealer experience is mock

---

#### 3. Publish Flow
**Dependencies:**
- Road readiness state logic
- VIN decoder (deprecated)
- Inspection upload (no S3)
- State assignment rules
- Mock publish API

**Blast Radius:** 🟡 Medium
**Risk:** State logic is critical and well-tested

---

### Safe-to-Remove Areas (Low Blast Radius)

✅ **Archived landing pages** - No dependencies
✅ **Page directory** - Dev tool only
✅ **Static content pages** - Independent
✅ **Storybook components** - Canvas-only

---

## PART 10 — CLEANUP RECOMMENDATION PLAN

### Phase 1: Safe Deletions (Immediate)

**Target:** Remove code with zero dependencies

1. ✅ Delete `src/_archived_pages/` folder (8 files)
2. ✅ Delete `/page-directory` route before production
3. ✅ Remove "Coming Soon" badges or implement features:
   - Appraisal in garage
   - Nexus in garage
   - Smart sorting in browse
   - Session management in profile
4. ✅ Remove or complete placeholder forms:
   - `/luxury` early access
   - `/ask` feature requests
   - `/contact-carly` contact form
   - `/report-issue` bug reporting

**Estimated Time:** 2 hours
**Risk:** None

---

### Phase 2: Archive & Document (1 week)

**Target:** Mark deprecated systems, add warnings

1. ✅ Add deprecation notices to:
   - `src/lib/vin/decoder.ts`
   - `src/app/api/dealer/reputation-v1/route.ts`
   - `MarketplaceMode` type (already marked)

2. ✅ Create `DEPRECATED.md` listing:
   - Deprecated APIs
   - Deprecated types
   - Migration paths

3. ✅ Add warnings to mock auth:
   - Banner in dev mode: "Using mock authentication"
   - Console warnings on mock API calls

4. ✅ Document TODO items:
   - Create GitHub issues for all `// TODO` comments
   - Group by system (Auth, Database, S3, etc.)
   - Prioritize by criticality

**Estimated Time:** 1 week
**Risk:** None (documentation only)

---

### Phase 3: Refactor Later (Post-Database Connection)

**Target:** Modernize after core infrastructure in place

1. 🔧 Replace all mock data with database queries
2. 🔧 Replace in-memory stores with Redis/DynamoDB
3. 🔧 Implement real authentication (Supabase)
4. 🔧 Connect S3 for file uploads
5. 🔧 Implement email notifications (SES)
6. 🔧 Connect Google Places API
7. 🔧 Implement payment processing
8. 🔧 Add real VIN decoder API
9. 🔧 Implement WebSocket messaging (replace polling)
10. 🔧 Complete dealer settings (branding, team management)

**Estimated Time:** 8-12 weeks
**Risk:** High (requires full infrastructure)

---

## FINAL RECOMMENDATIONS

### Immediate Actions (This Week)

1. ✅ **Delete archived pages** - Remove `_archived_pages` folder
2. ✅ **Remove page directory** - Delete `/page-directory` route
3. ✅ **Add auth warning banner** - "Demo mode: Using mock authentication"
4. ✅ **Create DEPRECATED.md** - Document all deprecated code
5. ✅ **Create TODO tracking** - Convert all TODO comments to GitHub issues

---

### Before Production Launch (Must Have)

1. ❌ **Connect database** - Supabase/Postgres
2. ❌ **Implement real auth** - Supabase Auth
3. ❌ **Connect S3** - File uploads (inspections, photos, CARFAX)
4. ❌ **Remove mock data** - Replace with database queries
5. ❌ **Implement payment processing** - Stripe/checkout flow
6. ❌ **Add rate limiting** - Prevent abuse
7. ❌ **Add error tracking** - Sentry/logging
8. ❌ **Add monitoring** - Uptime, performance
9. ❌ **Security audit** - Penetration testing
10. ❌ **Legal review** - Privacy policy, terms enforcement

---

### Post-Launch Improvements (Nice to Have)

1. 🔜 Email notifications (SES + templates)
2. 🔜 Google Places sync
3. 🔜 WebSocket messaging (replace polling)
4. 🔜 Dealer branding customization
5. 🔜 Smart sorting (personalized ranking)
6. 🔜 Vehicle appraisal integration
7. 🔜 Nexus relationship scores
8. 🔜 Team management for dealers
9. 🔜 Advanced analytics dashboard
10. 🔜 Mobile app (React Native)

---

## CONCLUSION

**Platform Status:** 🟡 **Functional Prototype, Not Production Ready**

**Strengths:**
- ✅ Clean, modern UI/UX
- ✅ Well-architected systems (reputation, appointments, state management)
- ✅ Comprehensive feature set
- ✅ Good code organization
- ✅ Type-safe with TypeScript

**Weaknesses:**
- 🔴 No database connection
- 🔴 Mock authentication only
- 🔴 No file storage (S3)
- 🔴 No email notifications
- 🔴 No payment processing
- ⚠️ Heavy reliance on mock data
- ⚠️ Many placeholder features

**Launch Blockers:**
1. Database infrastructure
2. Real authentication
3. Payment processing
4. Legal compliance (data storage, GDPR)
5. Security hardening

**Recommended Timeline:**
- **Infrastructure Setup:** 3-4 weeks
- **Feature Completion:** 4-6 weeks
- **Testing & Security:** 2-3 weeks
- **Total:** 9-13 weeks to production readiness

---

**END OF AUDIT REPORT**
