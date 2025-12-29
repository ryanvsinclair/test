# CARLY PLATFORM - MASTER ARCHITECTURE DOCUMENT

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production-track codebase with known gaps  
**Purpose:** Canonical reference for architecture, decisions, and implementation state

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Runtime Architecture](#3-runtime-architecture)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Data Layer](#5-data-layer)
6. [State Management](#6-state-management)
7. [Routing & Navigation](#7-routing--navigation)
8. [Feature Systems](#8-feature-systems)
9. [Deployment & Environment](#9-deployment--environment)
10. [Known Issues & Tech Debt](#10-known-issues--tech-debt)
11. [Design Intent & Future Direction](#11-design-intent--future-direction)

---

## 1. EXECUTIVE SUMMARY

### 1.1 What Carly Is

**Carly** is a dual-sided automotive marketplace platform that connects:
- **Buyers**: searching for vehicles with trust, transparency, and personalization
- **Dealers**: managing inventory, leads, and reputation
- **Platform Admins**: overseeing operations, dealer applications, and system health

**Core Differentiation:**
- **Process-based reputation** (not just star ratings)
- **Three marketplace modes** (Carly Verified, The Hub, Builder's Market)
- **Free browsing before authentication** (SEO-first, not login-walled)
- **Transparency-first design** (road readiness states, verified data)

### 1.2 Technology Stack

- **Framework:** Next.js 14.2.23 (App Router)
- **Language:** TypeScript 5
- **UI:** React 18, TailwindCSS 3, ShadCN components, Framer Motion
- **Database:** Supabase (PostgreSQL 14+)
- **Auth:** Supabase Auth (JWT-based sessions)
- **Hosting:** Standalone output (Docker-ready)
- **State:** React Context API + Zustand
- **Styling:** Tailwind + CSS variables for theming

### 1.3 Current State Assessment

**Overall Status:** 🟡 **FUNCTIONAL BUT INCOMPLETE**

✅ **What Works:**
- Complete UI/UX flows for all user types
- Auth flow (recently stabilized after race condition fixes)
- Browse/search/filter marketplace
- Dealer portal with inventory management UI
- Appointments system (state machine implemented)
- Reputation system (scoring algorithms complete)
- Messaging UI and flow
- SEO metadata and sitemap generation

⚠️ **What's Incomplete:**
- Database queries return empty/minimal data (schema exists, queries need implementation)
- File uploads (S3 integration stubbed)
- Email notifications (SES not configured)
- Payment processing (not started)
- Analytics storage (events fire, nowhere to save)
- VIN decoding (NHTSA API exists but needs error handling)

🔴 **Critical Gaps:**
- Most features use in-memory stores instead of database
- No production data seeding strategy
- RLS policies defined but not fully tested
- Admin panel minimal (dealer approval flow incomplete)

**Estimated to Production:** 8-12 weeks of backend integration work

### 1.4 Key Architectural Decisions

| Decision | Rationale | Tradeoffs |
|----------|-----------|-----------|
| **Next.js App Router** | Server Components, parallel routes, modern DX | Learning curve, SSR complexity |
| **Public-first browsing** | SEO, user trust, remove friction | Must handle auth everywhere |
| **Middleware for auth** | Central enforcement, SSR-safe | Can't access client state |
| **Three client types** | Supabase SSR client, browser client, admin client | Must choose correctly or bypass RLS |
| **Single /browse route** | Canonical marketplace, no duplication | Must handle authenticated/unauthenticated UI |
| **Welcome page as public transition** | Solves auth hydration race condition | Extra navigation step post-login |
| **Role from database only** | Single source of truth | Requires profile table lookup |
| **Process-based reputation** | Fair, explainable, future-proof | Requires event logging at every step |

---

## 2. PRODUCT OVERVIEW

### 2.1 User Personas

#### 2.1.1 Buyers
**Who:** Individuals looking to purchase a vehicle  
**Needs:** Trust signals, transparency, no sales pressure, personalized recommendations  
**Entry:** Can browse without login, enhanced features require account

**Key Buyer Features:**
- Browse all listings without authentication
- Natural language search ("cheap reliable SUV")
- Save vehicles (requires auth)
- Message dealers (requires auth)
- Schedule appointments (requires auth)
- Taste learning (preference inference from behavior)
- Garage (owned vehicles + publish to sell)

#### 2.1.2 Dealers
**Who:** Licensed dealerships selling inventory  
**Needs:** Lead management, inventory tools, reputation building, client intelligence  
**Entry:** Must apply for dealer account, admin approval required

**Key Dealer Features:**
- Inventory management (CRUD listings)
- Bulk upload tools (CSV, photos, CARFAX)
- Lead inbox with buyer insights
- Performance analytics
- Reputation dashboard (CarlyScore)
- Appointment management
- Team member invitations

#### 2.1.3 Admins
**Who:** Platform operators  
**Needs:** Dealer approval, system monitoring, content moderation  
**Entry:** `user_metadata.is_admin = true` flag (no admin login page)

**Key Admin Features:**
- Dealer application review
- User management
- Listings moderation
- Platform analytics (planned)

### 2.2 Core Value Propositions

**For Buyers:**
1. **Transparency:** Road readiness states show vehicle condition honestly
2. **Trust:** Process-based dealer reputation, not just reviews
3. **No Pressure:** Browse freely, dealers can't see who's viewing
4. **Personalization:** Taste learning adapts to preferences without intrusive surveys

**For Dealers:**
1. **Fair Reputation:** Earn trust through consistent execution, not gaming reviews
2. **Client Intelligence:** See buyer preferences before first contact
3. **Efficient Workflows:** Bulk tools, automated messaging, single dashboard
4. **Competitive Edge:** Carly Verified badge for quality dealers

### 2.3 Marketplace Modes

Three distinct marketplace segments based on vehicle condition/verification:

#### 2.3.1 Carly Verified (road_readiness_state = 'ready_to_go')
- **Definition:** Dealer-listed vehicles passing Carly's verification criteria
- **Requirements:** Running, inspected, safe for immediate test drive
- **UI Treatment:** Blue badge, default filter on /browse
- **Buyer Expectation:** Can buy with confidence, minimal surprises

#### 2.3.2 The Hub (road_readiness_state = 'needs_attention')
- **Definition:** Vehicles needing minor repairs but otherwise solid
- **Requirements:** Documented issues, estimated fix costs, honest disclosure
- **UI Treatment:** Yellow badge, filter toggle
- **Buyer Expectation:** Project cars, fixable issues clearly stated

#### 2.3.3 Builder's Market (road_readiness_state = 'major_repairs' | 'as_is')
- **Definition:** Non-running, major repair needs, or sold as-is
- **Requirements:** May not run, must disclose all known issues
- **UI Treatment:** Red badge, separate /as-is-vehicles route
- **Buyer Expectation:** Mechanic specials, parts cars, restoration projects

**Assignment Logic:** Automated based on:
- Vehicle running status
- Inspection documentation uploaded
- Issue severity (minor/moderate/major/critical)
- Dealer acknowledgment of state

### 2.4 User Journeys

#### 2.4.1 Unauthenticated Buyer Journey
```
Landing Page
  → Browse marketplace (public)
  → View listing details
  → Attempt to save/message
  → Sign up prompt
  → Welcome page
  → Browse continues (now personalized)
```

#### 2.4.2 Dealer Onboarding Journey
```
Landing page
  → "I'm a dealer" link
  → Sign up (starts as buyer)
  → Intent selection: "I'm a dealer"
  → Dealer application form
  → Admin approval (backend)
  → Profile updated: role='dealer', dealership_id set
  → Access dealer portal
```

#### 2.4.3 Appointment Lifecycle Journey
```
Buyer finds listing
  → Schedules appointment
  → Dealer confirms
  → Buyer confirms
  → Both arrive (check-in)
  → Complete test drive
  → Declare outcome (blind)
  → Reveal + optional review
  → Reputation events logged
```

---

## 3. RUNTIME ARCHITECTURE

### 3.1 Next.js App Router Structure

**Route Groups:**
```
src/app/
├── (public)/           # Marketing, help pages, browse
│   ├── page.tsx        # Landing page
│   ├── browse/         # Canonical marketplace
│   ├── listings/[id]/  # Listing details
│   └── meet-carly/     # About pages
├── auth/               # Authentication flows
│   ├── page.tsx        # Unified login/signup
│   ├── redirect/       # Post-auth role resolution
│   ├── intent/         # Post-signup intent selection
│   └── dealer/
│       └── apply/      # Dealer application
├── welcome/            # Public transition page (auth-aware)
├── buyer/              # Buyer-protected routes
│   ├── browse/         # DEPRECATED (redirects to /browse)
│   ├── garage/         # Saved + owned vehicles
│   ├── messages/       # Buyer inbox
│   └── appointments/   # Buyer appointments
├── dealer/             # Dealer-protected routes
│   ├── dashboard/      # Analytics overview
│   ├── listings/       # Inventory management
│   ├── messages/       # Lead inbox
│   └── reputation/     # CarlyScore dashboard
├── admin/              # Admin-protected routes
│   ├── dashboard/      # Platform overview
│   └── applications/   # Dealer approval queue
└── api/                # API routes (REST-style)
    ├── appointments/   # CRUD appointments
    ├── messages/       # Messaging
    └── dealer/         # Dealer operations
```

**Key Architectural Patterns:**
- **Server Components by default** (use 'use client' sparingly)
- **Parallel routes NOT used** (simpler mental model)
- **Route handlers for mutations** (src/app/api/*)
- **Middleware for auth gates** (runs before all routes)

### 3.2 Rendering Strategy

| Route Type | Rendering | Rationale |
|------------|-----------|-----------|
| Landing, marketing pages | SSG/ISR | SEO, fast load, static content |
| /browse | SSR | Auth-aware UI, personalized sorting when logged in |
| /listings/[id] | SSR | SEO, dynamic metadata per listing |
| /buyer/*, /dealer/* | CSR | Interactive, auth-required, no SEO need |
| /api/* | Server-only | Database access, auth enforcement |

**Hydration Order:**
1. Next.js server renders initial HTML
2. React hydrates on client
3. AuthContext mounts, calls `getSession()`
4. Watchdog timer (4s) ensures `isLoading` clears
5. Components can now safely read auth state

### 3.3 Middleware Responsibilities

**File:** `middleware.ts`

**Purpose:** Central auth enforcement, runs on EVERY request

**Execution Order:**
```
1. Check if public route → allow immediately
2. Check if auth route → allow (no redirect loops)
3. Check if admin route → verify is_admin flag
4. Get session from Supabase SSR
5. Fetch user profile from database (role, dealership_id)
6. Check dealer lifecycle status (pending/approved/active)
7. Enforce role-based route access
8. Allow or redirect
```

**Critical Rules:**
- Public routes bypass ALL checks (performance)
- Auth routes bypass to prevent redirect loops
- Admin check happens BEFORE profile query (optimization)
- Profile query is AUTHORITATIVE (not user_metadata)
- Middleware NEVER modifies database (read-only)

**Routes Allowed Without Auth:**
- `/`, `/browse`, `/welcome`, `/listings/*`, `/cars/*`
- `/meet-carly`, `/help-center`, `/privacy-policy`, etc.
- `/_next/*`, `/api/*` (API routes have own auth)

### 3.4 Client vs Server Responsibilities

#### 3.4.1 Client-Side Responsibilities
- UI interactivity (forms, filters, modals)
- Auth state consumption (useAuth hook)
- Optimistic UI updates
- View-level state (pagination, filters)
- Analytics event tracking

#### 3.4.2 Server-Side Responsibilities
- Database queries (via API routes or Server Components)
- Auth verification (session validation)
- RLS enforcement (via user-context Supabase client)
- Sensitive operations (profile creation, dealer approval)
- Email sending (when implemented)

#### 3.4.3 Hybrid (Both)
- Listing rendering (SSR for SEO, CSR for saved state)
- Search/filter (server for DB query, client for UI state)
- Messaging (server for persistence, client for WebSocket)

### 3.5 Supabase Client Architecture

**Three distinct clients:**

#### Browser Client (`src/lib/supabase/client.ts`)
- **Use:** Client-side auth operations only
- **Key:** NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Session:** Uses cookies automatically
- **RLS:** Enforced (acts as authenticated user)
- **Examples:** `signin()`, `signout()`, `getSession()`

#### Server Client (`src/lib/supabase/server.ts`)
- **Use:** API routes, Server Components, Server Actions
- **Key:** NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Session:** Reads from Next.js cookies
- **RLS:** Enforced (acts as authenticated user)
- **Examples:** Fetching user listings, creating messages

#### Admin Client (`src/lib/supabase/admin.ts`)
- **Use:** System operations, admin panel
- **Key:** SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
- **Session:** None (no user context)
- **RLS:** BYPASSED (full database access)
- **Examples:** Approve dealer, create profile on signup
- **Security:** Runtime check prevents browser import

**Critical Rule:** Never import admin client in any file that could be bundled for browser

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1 Authentication Flow (Recently Stabilized)

**Problem Solved:** Race condition between auth hydration and route navigation

**Solution:** Public welcome page as transition buffer

#### 4.1.1 Sign-In Flow
```
User enters credentials at /auth
  ↓
signin({ email, password }) → Supabase
  ↓
Session created in Supabase
  ↓
Navigate to /welcome (PUBLIC, auth-aware)
  ↓
Welcome page shows loading while AuthContext hydrates
  ↓
AuthContext fetches profile, sets user state
  ↓
Welcome animation plays
  ↓
User clicks "Enter" → /browse
```

**Key Fix:** /welcome is NOT guarded, so navigation succeeds immediately while auth hydrates in background

#### 4.1.2 Sign-Up Flow
```
User enters email/password/name/city at /auth
  ↓
signup({ email, password, role: 'buyer', ... })
  ↓
Profile created in database (server-side trigger or API)
  ↓
Auto-signin
  ↓
Navigate to /auth/intent
  ↓
User selects: "I'm looking for a vehicle" OR "I'm a dealer"
  ↓
If buyer: → /welcome → /browse
If dealer: → /auth/dealer/apply (application form)
```

**Key Decision:** All new users start as `role = 'buyer'`, dealers apply post-signup

### 4.2 AuthContext Lifecycle

**File:** `src/contexts/AuthContext.tsx`

**Responsibilities:**
- Fetch and cache session from Supabase
- Enrich session with profile data (role, dealership_id, verified)
- Provide computed auth flags (isAuthenticated, isBuyer, isDealer, isAdmin)
- Manage saved vehicles (buyer-only)
- Provide login/logout functions

**State Machine:**
```
Mount
  ↓
isLoading = true
  ↓
getSession() from Supabase
  ↓
resolveSession() → fetch profile
  ↓
setUser(enrichedUser)
  ↓
isLoading = false
  ↓
Listen for auth state changes (onAuthStateChange)
```

**Watchdog Timer:** 4-second hard limit on `isLoading = true` to prevent infinite spinners

**Hydration Lock:** `hydrationRef` prevents concurrent profile fetches (from BroadcastChannel or StrictMode)

### 4.3 Role System

**Three roles, defined in database only:**

#### 4.3.1 Buyer (Default)
- **Value:** `role = 'buyer'`
- **Permissions:** Browse, save, message dealers, schedule appointments
- **Routes:** `/buyer/*`
- **Profile Requirement:** `name` and `city` (required at signup)

#### 4.3.2 Dealer
- **Value:** `role = 'dealer'`
- **Permissions:** Manage inventory, view leads, see buyer intelligence
- **Routes:** `/dealer/*`
- **Profile Requirement:** `dealership_id` (set after admin approval)
- **Lifecycle States:**
  - `pending`: Application submitted, awaiting review
  - `approved`: Approved but onboarding incomplete
  - `active`: Full portal access
  - `suspended`: Temporarily disabled
  - `rejected`: Application denied

#### 4.3.3 Admin (Capability Flag)
- **Value:** `user_metadata.is_admin = true` (NOT a role column)
- **Permissions:** Platform operations, dealer approval, user management
- **Routes:** `/admin/*`
- **No separate login:** Admins log in as buyer/dealer, auto-redirect to admin panel

**Role Resolution Order:**
1. Check `user_metadata.is_admin` first (middleware)
2. Query `profiles.role` from database (authoritative)
3. If dealer, also check `profiles.dealership_id` and `dealerships.lifecycle_status`
4. Redirect to appropriate dashboard

### 4.4 Known Auth Fragility Points

**Fixed Issues:**
- ✅ Welcome page race condition (solved by making /welcome public)
- ✅ Infinite loading spinners (watchdog timer)
- ✅ Multiple auth page variants (unified to /auth)
- ✅ Client-server session desync (Supabase SSR cookies)

**Remaining Risks:**
- ⚠️ Middleware runs on EVERY request (performance impact at scale)
- ⚠️ Profile query on every middleware hit (should be cached)
- ⚠️ No session refresh logic (tokens can expire mid-session)
- ⚠️ StrictMode can trigger double hydration (mitigated by hydrationRef)

**Mitigation Strategies:**
- Middleware caching (TODO: implement with short TTL)
- Session refresh listener in AuthContext (TODO)
- Profile data in JWT claims (requires Supabase Edge Function hook)

### 4.5 Protected Route Enforcement

**Two-layer protection:**

#### Layer 1: Middleware (`middleware.ts`)
- Server-side, runs on every request
- Enforces auth requirements
- Redirects unauthenticated users
- Checks role and dealership status
- **Cannot be bypassed** (runs before page renders)

#### Layer 2: RouteGuard (`src/components/layouts/RouteGuard.tsx`)
- Client-side, wraps protected pages
- Reads useAuth() state
- Shows loading spinner if auth loading
- Redundant safety net for middleware
- **Can be bypassed** (client-side only)

**Why both?** Defense in depth + better UX (client guard shows app shell while loading)

---

## 5. DATA LAYER

### 5.1 Database Overview

**Provider:** Supabase (PostgreSQL 14+)  
**Schema File:** `supabase/migrations/000_complete_schema.sql`  
**ORM:** None (raw SQL queries via Supabase client)

### 5.2 Core Tables

#### 5.2.1 profiles
**Purpose:** Extends auth.users with app-specific fields

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR NOT NULL,
  name VARCHAR,
  phone VARCHAR,
  role user_role DEFAULT 'buyer',  -- AUTHORITATIVE
  dealer_status dealer_status,
  dealership_id UUID REFERENCES dealerships(id),
  verified BOOLEAN DEFAULT false,
  city VARCHAR,
  region VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `id` → `auth.users.id` (1:1)
- `dealership_id` → `dealerships.id` (nullable for buyers)

**RLS Rules:**
- Users can read/update own profile
- Admins can read/update all profiles
- INSERT via server-side trigger only

#### 5.2.2 dealerships
**Purpose:** Dealer organization data (separate from profiles)

```sql
CREATE TABLE dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  lifecycle_status VARCHAR DEFAULT 'pending',  -- pending/approved/active/suspended/rejected
  operational_status VARCHAR DEFAULT 'active',
  address JSONB,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  business_hours JSONB,
  branding JSONB,
  -- ... many more fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `dealerships.id` ← `profiles.dealership_id` (1:many)
- `dealerships.id` ← `listings.dealer_id` (1:many)

**RLS Rules:**
- Public can read active dealerships
- Dealers can read/update own dealership
- Admins can read/update all dealerships

#### 5.2.3 listings
**Purpose:** Vehicle listings (canonical inventory table)

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES profiles(id),
  carly_listing_id VARCHAR UNIQUE,  -- CARLY-{REGION}-{MODE}-{YYYYMM}-{RANDOM}
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR,
  model VARCHAR,
  trim VARCHAR,
  price DECIMAL(10, 2),
  mileage INTEGER,
  marketplace_mode marketplace_mode,  -- carly_verified/the_hub/builders_market
  road_readiness_state road_readiness_state,  -- ready_to_go/needs_attention/major_repairs/as_is
  status vehicle_state DEFAULT 'draft',  -- draft/active/sold/deleted
  images JSONB DEFAULT '[]'::jsonb,
  -- ... many more fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ
);
```

**Key Relationships:**
- `dealer_id` → `profiles.id` (many:1)
- `id` ← `conversations.listing_id` (1:many)
- `id` ← `appointments.listing_id` (1:many)

**RLS Rules:**
- Public can read listings with status='active'
- Dealers can CRUD own listings
- Admins can CRUD all listings

**Indexes:**
- `dealer_id`, `status`, `marketplace_mode`, `road_readiness_state`
- `year`, `make`, `model`, `price`, `created_at`
- `carly_listing_id` (unique)
- `vin` (partial, for VIN lookups)

#### 5.2.4 conversations
**Purpose:** Buyer-dealer messaging threads

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  dealer_id UUID NOT NULL REFERENCES profiles(id),
  listing_id UUID REFERENCES listings(id),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count_buyer INTEGER DEFAULT 0,
  unread_count_dealer INTEGER DEFAULT 0,
  archived_by_buyer BOOLEAN DEFAULT false,
  archived_by_dealer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_conversation UNIQUE(buyer_id, dealer_id, listing_id)
);
```

**Key Relationships:**
- `buyer_id` → `profiles.id` (many:1)
- `dealer_id` → `profiles.id` (many:1)
- `listing_id` → `listings.id` (many:1, nullable)
- `id` ← `messages.conversation_id` (1:many)

**RLS Rules:**
- Participants can read/update own conversations
- Admins can read all conversations

#### 5.2.5 messages
**Purpose:** Individual messages within conversations

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  status message_status DEFAULT 'sent',  -- sent/delivered/read
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `conversation_id` → `conversations.id` (many:1)
- `sender_id` → `profiles.id` (many:1)

**RLS Rules:**
- Participants can read messages (via JOIN to conversations)
- Participants can insert messages (sender_id = auth.uid())
- Messages are immutable (no UPDATE/DELETE)

#### 5.2.6 appointments
**Purpose:** Test drive and viewing appointments

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  dealer_id UUID NOT NULL REFERENCES profiles(id),
  listing_id UUID NOT NULL REFERENCES listings(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  appointment_type VARCHAR DEFAULT 'test_drive',
  status appointment_status DEFAULT 'scheduled',  -- scheduled/confirmed/completed/cancelled/no_show
  buyer_notes TEXT,
  dealer_notes TEXT,
  cancellation_reason TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `buyer_id` → `profiles.id` (many:1)
- `dealer_id` → `profiles.id` (many:1)
- `listing_id` → `listings.id` (many:1)

**RLS Rules:**
- Participants can read own appointments
- Buyers can create appointments
- Dealers can update appointment status
- Admins can read/update all appointments

### 5.3 RLS Philosophy

**Principle:** Defense in depth, but NOT the only security layer

**Strategy:**
1. **Public data is truly public** (active listings, dealer profiles)
2. **User data is scoped to user** (profiles, saved vehicles)
3. **Relational data checks participants** (conversations, messages)
4. **Admin bypasses via JWT claims** (`auth.jwt() ->> 'role' = 'admin'`)
5. **Immutable tables prevent deletion** (messages, reputation events)

**Known Issues:**
- RLS policies defined but **not fully tested**
- Some queries may be bypassing RLS unintentionally (using admin client)
- Performance impact of RLS at scale unknown

**Testing Gap:** No automated RLS test suite (manual verification only)

### 5.4 Authoritative Query Patterns

**Server-Side Queries (Authoritative):**
- User authentication (Supabase Auth)
- Profile creation/updates (admin client)
- Dealer approval (admin client)
- Listing mutations (server client as dealer)

**Client-Side Queries (Read-Only):**
- Browse listings (browser client)
- View own profile (browser client)
- Fetch saved vehicles (browser client)

**Hybrid Queries:**
- Search/filter listings (server for DB, client for UI)
- Messaging (server for persistence, client for real-time)

**Critical Rule:** NEVER mutate data from client-side code (always go through API route)

### 5.5 Views and RPCs

**Current State:** None defined

**Planned:**
- `public_listings` view (pre-filters active listings)
- `dealer_stats` view (aggregate analytics)
- `get_personalized_listings()` RPC (custom ranking)

### 5.6 Database Connection State

**Production:** ✅ Connected (Supabase project configured)

**Implementation Status:**
- ✅ Schema defined and deployed
- ✅ RLS policies defined
- ⚠️ Most queries return empty data (need implementation)
- ⚠️ In-memory stores used as placeholders
- ❌ No seed data script
- ❌ No test data fixtures

**Estimated Work:** 3-4 weeks to fully migrate from in-memory to database

---

## 6. STATE MANAGEMENT

### 6.1 Global State Providers

#### 6.1.1 AuthContext (`src/contexts/AuthContext.tsx`)
**Purpose:** Auth state, user profile, saved vehicles

**State:**
- `user: User | null`
- `isLoading: boolean`
- `isAuthenticated`, `isUnauthenticated`, `isLoggedOut` (computed)
- `isBuyer`, `isDealer`, `isDealerApproved`, `isAdmin` (computed)
- `savedVehicleIds: Set<string>`

**Methods:**
- `login(email, password)`
- `logout()`
- `saveVehicle(id)`, `unsaveVehicle(id)`, `isSaved(id)`

**Critical:** This is the ONLY source of auth state in the app

#### 6.1.2 ThemeContext (`src/contexts/ThemeContext.tsx`)
**Purpose:** Dark/light theme toggle

**State:**
- `theme: 'light' | 'dark' | 'system'`

**Methods:**
- `setTheme(theme)`

**Persistence:** localStorage

#### 6.1.3 UnitsContext (`src/contexts/UnitsContext.tsx`)
**Purpose:** Distance/volume units (km vs mi, L vs gal)

**State:**
- `distanceUnit: 'km' | 'mi'`
- `volumeUnit: 'L' | 'gal'`

**Methods:**
- `toggleDistanceUnit()`, `toggleVolumeUnit()`

**Persistence:** localStorage

### 6.2 Local State Patterns

**Component-Level State:**
- Form inputs (controlled components)
- Modal open/closed
- Pagination, filters, sort order
- Temporary UI state (loading buttons)

**URL State:**
- Search params for filters (/browse?make=Toyota)
- Pagination (/browse?page=2)
- NOT IMPLEMENTED (all state is local)

**localStorage State:**
- View mode (card/list)
- Road readiness filter preferences
- Temporarily saved match profile (pre-signup)

### 6.3 Loading State Ownership

**Who owns `isLoading`?**

| Scenario | Owner | Blocks Render? |
|----------|-------|----------------|
| Initial auth hydration | AuthContext | YES (via StateRouter) |
| API calls | Component | NO (component-level spinner) |
| Route navigation | Next.js | NO (instant navigation) |
| Form submission | Component | NO (button disabled state) |

**StateRouter Loading Gate:**
```tsx
if (isLoading) {
  return <LoadingSpinner />; // Blocks entire app render
}
```

**Critical:** `isLoading` MUST clear within 4 seconds (watchdog) or app hangs

### 6.4 Known Deadlock Risks

**Scenario 1: Middleware + AuthContext race**
- Middleware redirects to /auth
- AuthContext still loading
- /auth page tries to redirect back
- **Solution:** Auth routes bypass StateRouter

**Scenario 2: Profile query failure**
- Middleware fetches profile from DB
- Query fails (network, DB down)
- User stuck at loading
- **Solution:** Fallback to user_metadata, watchdog timer

**Scenario 3: Infinite hydration loop**
- StrictMode mounts twice
- Both mounts call getSession()
- Concurrent profile queries
- **Solution:** `hydrationRef` mutex

---

## 7. ROUTING & NAVIGATION

### 7.1 Public vs Protected Routes

**Public (No Auth Required):**
- `/` - Landing page
- `/browse` - Canonical marketplace
- `/welcome` - Auth-aware transition page
- `/listings/[id]` - Listing details
- `/cars/[country]/[region]/[city]/[slug]` - SEO listing routes
- `/as-is-vehicles` - Builder's market
- `/meet-carly`, `/how-carly-works`, `/help-center`, etc.

**Auth-Required (Middleware Enforces):**
- `/buyer/*` - Buyer dashboard, garage, messages
- `/dealer/*` - Dealer portal
- `/admin/*` - Admin panel

**Auth Routes (No Redirect Loops):**
- `/auth`, `/auth/redirect`, `/auth/intent`, `/auth/dealer/apply`

### 7.2 Route Transitions After Auth

**Post-Login:**
```
/auth
  → Supabase auth succeeds
  → Navigate to /welcome
  → Wait for auth hydration
  → User clicks "Enter"
  → Navigate to /browse
```

**Post-Signup:**
```
/auth
  → Supabase signup succeeds
  → Navigate to /auth/intent
  → User selects buyer/dealer
  → If buyer: /welcome → /browse
  → If dealer: /auth/dealer/apply
```

**Post-Dealer-Approval:**
```
Admin approves application
  → Update profiles.role = 'dealer'
  → Update profiles.dealership_id
  → User logs in
  → Middleware detects dealer role
  → Redirect to /dealer/onboarding (if approved)
  → Redirect to /dealer/dashboard (if active)
```

### 7.3 Navigation Component Logic

**StateRouter (`src/components/layouts/StateRouter.tsx`):**
- Wraps all pages
- Renders appropriate nav based on auth state
- Does NOT redirect (middleware handles that)

**Nav Rendering Rules:**
```
Admin routes → No nav (admin layout)
Auth routes → No nav (clean auth UI)
isLoading → Loading spinner
isLoggedOut OR public pages → LoggedOutNav
isBuyer → BuyerNav
isDealerApproved → DealerNav
```

**Nav Components:**
- `LoggedOutNav`: CTA-focused, sign-in button, minimal links
- `BuyerNav`: Browse, garage, messages, profile dropdown
- `DealerNav`: Dashboard, listings, messages, insights, settings

### 7.4 SEO vs Personalization Strategy

**SEO-First Routes:**
- `/browse` - Always SSR, public cache, meta tags
- `/listings/[id]` - SSR per listing, structured data
- `/cars/[country]/[region]/[city]/[slug]` - SSR, canonical URLs

**Personalization Layer (When Authenticated):**
- Saved vehicle states in UI
- Personalized sort order (taste learning)
- Dealer intelligence in messages
- Does NOT change listing visibility

**Key Decision:** Listings are NEVER hidden from SEO (no auth-gating content)

### 7.5 Deprecated Routes

**Redirects:**
- `/explore` → `/browse`
- `/buyer/browse` → `/browse`
- `/buyer/welcome` → `/welcome`

**Reason:** Consolidation to single canonical marketplace

---

## 8. FEATURE SYSTEMS

### 8.1 Listings & Marketplace

**Implementation Status:** ✅ UI Complete, ⚠️ DB Incomplete

**Core Files:**
- `src/app/browse/page.tsx` - Canonical marketplace
- `src/components/listings/ListingsCardGrid.tsx` - Card view
- `src/components/listings/ListingsListView.tsx` - List view
- `src/lib/marketplace/roadReadinessStates.ts` - State definitions

**Features:**
- ✅ Browse without auth
- ✅ Search (natural language + filters)
- ✅ Road readiness filter toggle
- ✅ Sort options (newest, lowest price, etc.)
- ✅ Card/list view toggle (persisted to localStorage)
- ✅ Pagination (15/30/50 per page)
- ⚠️ Personalized sorting (UI exists, algorithm needs tuning)
- ⚠️ Saved vehicle state (shows in UI, not synced to DB)

**Known Gaps:**
- No real listings in database (returns empty)
- VIN decoder exists but not called
- CARFAX integration stubbed
- Image upload not connected to S3

### 8.2 Dealer Portal

**Implementation Status:** ✅ UI Complete, ⚠️ DB Incomplete

**Core Files:**
- `src/app/dealer/dashboard/page.tsx` - Analytics overview
- `src/app/dealer/listings/page.tsx` - Inventory management
- `src/app/dealer/messages/page.tsx` - Lead inbox
- `src/components/dealer/ClientIntelligenceSidebar.tsx` - Buyer insights

**Features:**
- ✅ Inventory CRUD UI
- ✅ Bulk upload modals (CSV, photos, CARFAX)
- ✅ Vehicle command modal (quick edit)
- ✅ Client intelligence (buyer preference display)
- ✅ Bulk messaging templates
- ⚠️ Analytics dashboard (UI complete, no real data)
- ⚠️ Reputation dashboard (CarlyScore display, mock data)
- ❌ Team member invitations (UI not started)

**Known Gaps:**
- Bulk upload doesn't save to DB or S3
- CARFAX matching is mocked
- Analytics queries return empty
- Reputation scores not calculated from real data

### 8.3 Appointments System

**Implementation Status:** ✅ Logic Complete, ⚠️ DB Incomplete

**Core Files:**
- `src/lib/appointments/state-machine.ts` - State machine logic
- `src/lib/appointments/db.ts` - In-memory store (temporary)
- `src/lib/appointments/reputation-integration.ts` - Event logging
- `src/components/test-drive/TestDriveModal.tsx` - Scheduling UI

**State Machine:**
```
created → pending_confirmation
  → confirmed (both confirm)
  → in_progress (both arrive)
  → completed (both finish)
  → reviewed (optional)
```

**Reputation Integration:**
- ✅ Events logged to reputation system
- ✅ Punctuality scoring
- ✅ No-show tracking
- ⚠️ Events saved to in-memory store (not DB)

**Known Gaps:**
- Appointments not persisted to DB
- Email reminders not sent (SES not configured)
- Dealer calendar integration not started

### 8.4 Messaging

**Implementation Status:** ✅ UI Complete, ⚠️ DB Incomplete

**Core Files:**
- `src/app/api/messages/route.ts` - Message API
- `src/lib/messaging/store.ts` - In-memory message store
- `src/components/messaging/MessagePopup.tsx` - Inline message UI

**Features:**
- ✅ Conversation list
- ✅ Message threading
- ✅ Buyer-dealer messaging UI
- ✅ Unread counts
- ⚠️ Real-time updates (polling only, no WebSocket)
- ❌ Message attachments (not implemented)
- ❌ Email notifications (not configured)

**Known Gaps:**
- Messages stored in-memory (not DB)
- No WebSocket for real-time
- No read receipts
- No typing indicators

### 8.5 Reputation System

**Implementation Status:** ✅ Algorithm Complete, ⚠️ DB Incomplete

**Core Files:**
- `src/lib/reputation/scoring.ts` - CarlyScore v1 algorithm
- `src/lib/reputation/event-ledger.ts` - Event logging
- `src/lib/reputation/db.ts` - In-memory store (temporary)

**Algorithm:**
```
CarlyScore = w_google * G + w_process * P + w_sentiment * S + R + V

Where:
- G = Google rating (0-100)
- P = Process score (A-E event completion) - PRIMARY
- S = Sentiment score (user reviews)
- R = Resolution overlay (issue handling)
- V = Variance overlay (consistency bonus)
```

**Event Types (A-E):**
- A: Appointment confirmed
- B: Test drive confirmed
- C: Finance session confirmed
- D: Purchase confirmed
- E: Delivery confirmed

**Features:**
- ✅ Scoring algorithm implemented
- ✅ Event ledger (immutable log)
- ✅ Google Places API integration (stubbed)
- ⚠️ Events logged to in-memory store (not DB)
- ⚠️ Scores calculated on-demand (not cached)

**Known Gaps:**
- Reputation events not persisted to DB
- Google Places API key not configured
- Score recomputation not scheduled (needs cron)

### 8.6 Vehicle Publish Flow

**Implementation Status:** ✅ UI Complete, ⚠️ DB Incomplete

**Core Files:**
- `src/components/publish/PublishFlowWizard.tsx` - Multi-step wizard
- `src/lib/marketplace/publish-flow.ts` - State assignment logic
- `src/lib/marketplace/roadReadinessStates.ts` - State definitions

**Steps:**
1. Marketplace mode selection (Carly Verified / The Hub / Builder's Market)
2. Vehicle condition (running, issues severity)
3. Inspection upload (PDF, photos)
4. Issues disclosure (if any)
5. State review (auto-assigned based on inputs)
6. Acknowledgement (terms acceptance)

**State Assignment Logic:**
```
If running AND inspection AND no major issues → Carly Verified
If running AND (no inspection OR minor issues) → The Hub
If not running OR major issues → Builder's Market
If user overrides → Builder's Market (as-is)
```

**Known Gaps:**
- Inspection upload doesn't save to S3
- State assignment runs but not saved to DB
- Listing creation returns 200 but doesn't persist

### 8.7 Analytics & Tracking

**Implementation Status:** ✅ Events Fire, ❌ Storage Not Implemented

**Core Files:**
- `src/lib/analytics/client.ts` - Event tracking
- `src/app/api/analytics/event/route.ts` - Event receiver

**Events Tracked:**
- Page views
- Listing views
- Search queries
- Filter changes
- Save/unsave actions
- Message sent
- Appointment scheduled

**Known Gaps:**
- Events fire but nowhere to save them
- No analytics dashboard
- No reporting/export
- No retention or funnel analysis

---

## 9. DEPLOYMENT & ENVIRONMENT

### 9.1 Expected Hosting Environment

**Target:** Docker container (Next.js standalone output)

**Build Output:**
```
next.config.js:
  output: 'standalone'
```

**Dockerfile (Recommended):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 9.2 Environment Variables Required

**Critical (App Won't Start):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (RLS enforced)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS) - SERVER ONLY

**Optional (Features Disabled if Missing):**
- `AWS_S3_BUCKET` - File uploads (photos, CARFAX)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - S3 credentials
- `SENDGRID_API_KEY` or `AWS_SES_*` - Email notifications
- `GOOGLE_PLACES_API_KEY` - Reputation system (Google reviews sync)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` - Payments (not started)

**Development Only:**
- `NODE_ENV=development` - Enables verbose logging
- `NEXT_PUBLIC_ENABLE_MOCK_DATA=false` - Mock data toggle (currently hardcoded false)

### 9.3 Local vs Cloud Differences

**Local Development:**
- `npm run dev` - Next.js dev server
- Hot reload enabled
- Verbose logging
- StrictMode enabled (can cause double renders)

**Production:**
- `npm run build && npm start` - Optimized build
- No hot reload
- Minimal logging
- StrictMode disabled (recommended)

**Known Issues:**
- Middleware runs on every request (high CPU in dev mode)
- AuthContext logs are verbose (should be removed for production)

### 9.4 Constraints Discovered

**Container Limits:**
- Standalone output requires ~200MB disk
- Node.js process uses ~150MB RAM at idle
- Middleware profile queries add ~50ms per request (will increase under load)

**Performance Bottlenecks:**
- Middleware calls Supabase on EVERY protected route hit (no caching)
- Profile query repeated even for same user across requests
- AuthContext fetches profile on every page load (not cached)

**Recommendations:**
- Implement Redis cache for profile data (5-minute TTL)
- Move profile data into JWT claims (reduces DB queries)
- Add CDN for static assets and images
- Enable Next.js image optimization (Supabase Storage as source)

---

## 10. KNOWN ISSUES & TECH DEBT

### 10.1 Current Instability Sources

**High Priority (Blocks Production):**
1. **Database queries return empty** - Most features use in-memory stores
2. **No file upload backend** - S3 integration stubbed
3. **Email not configured** - Appointment reminders, notifications don't send
4. **Admin approval flow incomplete** - Dealers can't actually be approved
5. **No seed data** - Fresh DB has zero listings

**Medium Priority (Usability Issues):**
1. **Middleware performance** - No caching, profile queried on every request
2. **AuthContext logs are verbose** - Pollutes console, should be feature-flagged
3. **No error boundaries** - Component errors crash entire app
4. **No loading skeletons** - Sudden content pop-in
5. **Session refresh not implemented** - Tokens can expire mid-session

**Low Priority (Polish):**
1. **No analytics storage** - Events fire but aren't saved
2. **Reputation scores not cached** - Recomputed on every view
3. **No A/B testing framework** - Can't experiment with UX
4. **No user feedback loop** - Bug reports go nowhere

### 10.2 Near-Final But Buggy Areas

**Auth Flow:**
- ✅ Timing race condition fixed (welcome page solution)
- ⚠️ Session refresh can cause logout mid-session
- ⚠️ Middleware profile caching needed (performance)

**Messaging:**
- ✅ UI complete and functional
- ⚠️ In-memory store loses data on server restart
- ⚠️ Polling interval too aggressive (every 5s)

**Appointments:**
- ✅ State machine logic solid
- ⚠️ In-memory store loses data on server restart
- ⚠️ Email reminders not sending

**Reputation:**
- ✅ Algorithm correct and tested
- ⚠️ Event ledger in-memory (should be DB)
- ⚠️ Google Places API not configured

### 10.3 Temporary Hacks or Fallbacks

**AuthContext Watchdog Timer:**
```typescript
const watchdog = setTimeout(() => {
  console.error("[AUTH-CONTEXT] 🔴 Watchdog fired — forcing isLoading=false");
  if (alive) setIsLoading(false);
}, 4000);
```
- **Why:** Prevents infinite loading if profile query hangs
- **Risk:** User sees app with stale/missing auth state
- **Proper Fix:** Implement retry logic with exponential backoff

**Middleware Profile Query (No Caching):**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, dealership_id')
  .eq('id', session.user.id)
  .single();
```
- **Why:** Need role to route correctly
- **Risk:** Performance degrades at scale (DB hit on every request)
- **Proper Fix:** Cache profile in Redis or move to JWT claims

**In-Memory Stores:**
```typescript
const savedVehiclesStore = new Map<string, string[]>();
const messageStore: Message[] = [];
const appointmentsStore = new Map<string, Appointment>();
```
- **Why:** Placeholder until DB queries implemented
- **Risk:** Data lost on server restart, not shared across instances
- **Proper Fix:** Implement all DB queries (estimated 3-4 weeks)

### 10.4 Parts That Should Not Be Touched Casually

**DO NOT MODIFY:**

1. **AuthContext hydration logic** - Recently stabilized after multiple race condition fixes
2. **Middleware route matching** - Fragile, easy to create redirect loops
3. **StateRouter rendering order** - Auth/admin bypasses are critical
4. **Welcome page auth-aware logic** - Solves timing race, changes break flow
5. **Supabase client creation** - Singleton pattern prevents session leaks
6. **RLS policies** - Not fully tested, changes could expose data

**MODIFY WITH CAUTION:**

1. **Listing query logic** - Affects SEO and public browsing
2. **Reputation scoring algorithm** - Dealers expect consistency
3. **Appointment state machine** - State transitions are logged immutably
4. **Profile creation logic** - Sync between auth.users and profiles is critical

**SAFE TO MODIFY:**

1. **UI components** (cards, buttons, modals)
2. **Styling** (Tailwind classes, theme colors)
3. **Copy/messaging** (error messages, help text)
4. **Analytics events** (add new events, change payloads)

---

## 11. DESIGN INTENT & FUTURE DIRECTION

### 11.1 Original Architecture Aims

**Core Principles (Must Preserve):**
1. **Transparency over flashiness** - Show vehicle condition honestly
2. **Process over opinions** - Reputation from actions, not just reviews
3. **SEO before auth** - Listings visible to Google and guests
4. **Fair to dealers** - Staff issues don't tank dealer reputation
5. **Personalization without intrusion** - Learn from behavior, don't ask surveys

**Architectural Goals (Partially Achieved):**
1. **Single marketplace** - ✅ /browse is canonical (no duplication)
2. **Role-based UIs** - ✅ Buyer, dealer, admin have distinct experiences
3. **Database as source of truth** - ⚠️ Defined but not fully implemented
4. **Auth hydration safety** - ✅ Fixed via welcome page solution
5. **Reputation as platform moat** - ⚠️ Algorithm complete, needs data

### 11.2 What Should Be Preserved During Refactors

**Non-Negotiable (Do Not Break):**
- Public browsing without auth (SEO, user trust)
- Three marketplace modes (Carly Verified, The Hub, Builder's Market)
- Process-based reputation system (A-E event spine)
- Single source of truth for role (profiles.role, not UI state)
- Welcome page as auth transition buffer (prevents race conditions)

**Highly Recommended:**
- Middleware as central auth gate (moving to client-side is regression)
- In-memory stores as placeholder pattern (clear what needs DB)
- Explicit role-based routing (no auto-redirect guessing)
- Separate Supabase clients (browser, server, admin with clear boundaries)

**Can Change If Needed:**
- Styling (Tailwind can be replaced, theme tokens are agnostic)
- Component library (ShadCN can be swapped)
- State management (Context can become Zustand or Redux)
- API layer (REST-style routes can become tRPC or GraphQL)

### 11.3 What Can Safely Change

**Low-Risk Changes:**
- UI components (buttons, cards, modals)
- Styling (colors, fonts, spacing)
- Copy/messaging (error messages, help text)
- Analytics events (add, remove, change payloads)
- Page layouts (as long as routes don't change)

**Medium-Risk Changes:**
- Database queries (test thoroughly, RLS implications)
- Auth flow (test across devices, ensure no loops)
- Reputation algorithm (dealer trust, must communicate changes)
- State machine logic (appointment/publish flows)

**High-Risk Changes:**
- Middleware logic (can break entire auth system)
- Supabase client usage (can bypass RLS or expose keys)
- Role system (affects routing, permissions, UI)
- Public browsing behavior (affects SEO, user acquisition)

### 11.4 Suggested Next Stabilization Milestones

**Phase 1: Database Integration (3-4 weeks)**
- Replace all in-memory stores with database queries
- Test RLS policies exhaustively
- Implement seed data script (100 sample listings)
- Add database query logging (detect slow queries)

**Phase 2: File Uploads (1-2 weeks)**
- Configure S3 bucket and credentials
- Implement photo upload (listings, dealer branding)
- Implement CARFAX upload and storage
- Add image optimization (Next.js Image, Supabase Storage)

**Phase 3: Email Notifications (1 week)**
- Configure SendGrid or AWS SES
- Implement appointment reminders (24h, 2h)
- Implement dealer application emails (approved/rejected)
- Add email template system

**Phase 4: Admin Completion (1-2 weeks)**
- Implement dealer approval flow (backend)
- Add admin dashboard (platform stats)
- Add listings moderation tools
- Add user management (suspend, delete)

**Phase 5: Performance Optimization (1 week)**
- Add Redis cache for profile data
- Implement middleware caching (short TTL)
- Add database query caching (listings, dealer stats)
- Add CDN for static assets

**Phase 6: Monitoring & Observability (1 week)**
- Add error tracking (Sentry or similar)
- Add performance monitoring (query times, render times)
- Add uptime monitoring (listing page, auth endpoints)
- Add analytics dashboard (real data, not mocked)

**Phase 7: Production Readiness (2 weeks)**
- Security audit (RLS, XSS, CSRF)
- Load testing (simulate 1000 concurrent users)
- Backup and disaster recovery plan
- Documentation for ops team (runbooks, troubleshooting)

**Total Estimated Time:** 10-13 weeks

### 11.5 Long-Term Vision

**Year 1 Goals:**
- 100+ active dealers
- 10,000+ listings
- CarlyScore recognized as trust standard
- Mobile app (React Native)

**Technical Debt to Address:**
- Migrate to monorepo (separate web, mobile, admin)
- Add GraphQL layer (more efficient than REST)
- Implement WebSocket for real-time messaging
- Add search engine (Algolia or Typesense)
- Add recommendation engine (ML-based personalization)

**Platform Expansion:**
- Add financing calculator
- Add vehicle history reports (CARFAX integration)
- Add insurance quotes
- Add trade-in appraisal
- Add delivery/shipping coordination

---

## APPENDIX A: File Structure Reference

```
carly/
├── docs/                         # All documentation
│   ├── MASTER_ARCHITECTURE.md    # THIS FILE
│   ├── architecture/             # High-level architecture docs
│   ├── marketplace/              # Marketplace mode, road readiness
│   ├── listings/                 # Listing system, SEO, smart tags
│   ├── appointments/             # Appointment state machine
│   ├── reputation/               # CarlyScore system
│   ├── messaging/                # Messaging architecture
│   ├── dealer/                   # Dealer portal features
│   ├── admin/                    # Admin system docs
│   ├── database/                 # Schema, RLS, deployment
│   └── root-docs/                # Auth, migrations, audits
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (public)/             # Landing, browse, listings
│   │   ├── auth/                 # Auth flows
│   │   ├── welcome/              # Post-auth transition
│   │   ├── buyer/                # Buyer routes
│   │   ├── dealer/               # Dealer routes
│   │   ├── admin/                # Admin routes
│   │   └── api/                  # API routes
│   ├── components/               # React components
│   │   ├── auth/                 # Auth forms
│   │   ├── buyer/                # Buyer-specific components
│   │   ├── dealer/               # Dealer-specific components
│   │   ├── listings/             # Listing cards, grids
│   │   ├── marketplace/          # Filters, toggles
│   │   ├── messaging/            # Message UI
│   │   ├── publish/              # Publish flow wizard
│   │   ├── test-drive/           # Appointment modals
│   │   └── ui/                   # ShadCN components
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx       # Auth state (PRIMARY)
│   │   ├── ThemeContext.tsx      # Dark/light theme
│   │   └── UnitsContext.tsx      # Distance/volume units
│   ├── lib/                      # Business logic
│   │   ├── api/                  # API wrappers (in-memory stores)
│   │   ├── appointments/         # Appointment state machine
│   │   ├── auth/                 # Auth functions
│   │   ├── marketplace/          # Publish flow, state assignment
│   │   ├── messaging/            # Message store
│   │   ├── reputation/           # CarlyScore algorithm
│   │   ├── search/               # NL parser, vehicle filter
│   │   ├── supabase/             # Supabase clients (browser, server, admin)
│   │   └── utils/                # Utility functions
│   └── types/                    # TypeScript types
│       ├── supabase.ts           # Generated from Supabase schema
│       └── index.ts              # App-specific types
├── supabase/
│   └── migrations/
│       └── 000_complete_schema.sql  # Full database schema
├── middleware.ts                 # Auth enforcement (CRITICAL)
├── next.config.js                # Next.js config (standalone output)
├── package.json                  # Dependencies
└── tailwind.config.ts            # Tailwind config
```

---

## APPENDIX B: Quick Reference - Common Tasks

### B.1 Add a New Protected Route

1. Create page in appropriate folder: `src/app/buyer/new-feature/page.tsx`
2. No middleware changes needed (automatically protected)
3. Add link to nav component: `src/components/layouts/BuyerNav.tsx`
4. Test: Logout → try to access route → should redirect to /auth

### B.2 Add a New API Endpoint

1. Create route handler: `src/app/api/new-endpoint/route.ts`
2. Get auth user: `const { data: { session } } = await supabase.auth.getSession()`
3. Query database: `const { data } = await supabase.from('table').select()`
4. Return JSON: `return NextResponse.json({ data })`

### B.3 Add a New Database Table

1. Add SQL to migration: `supabase/migrations/001_new_table.sql`
2. Define RLS policies in migration
3. Run migration: `supabase db push` (or deploy via Supabase dashboard)
4. Generate types: `supabase gen types typescript > src/types/supabase.ts`
5. Update API routes to query new table

### B.4 Debug Auth Issues

1. Check console logs (search for `[AUTH-CONTEXT]`, `[MIDDLEWARE]`, `[AUTH-FLOW]`)
2. Verify session exists: `await supabase.auth.getSession()`
3. Check middleware logs: `console.log('[MIDDLEWARE]', pathname, !!session)`
4. Check profile query: `await supabase.from('profiles').select()`
5. Verify role: `profiles.role` should match expected value

### B.5 Test RLS Policies

1. Create test user: `supabase.auth.signUp({ email, password })`
2. Get session: `const { data: { session } } = await supabase.auth.getSession()`
3. Query table: `await supabase.from('table').select()` (should see only own data)
4. Try to update other user's data: `await supabase.from('table').update({ ... }).eq('id', otherId)`
5. Should fail with permission error

---

## APPENDIX C: Decision Log

### C.1 Why Next.js App Router?

**Decision Date:** Project inception  
**Alternatives Considered:** Pages Router, Remix, Astro  
**Chosen:** App Router  
**Rationale:**
- Server Components reduce client bundle
- Parallel routes allow complex layouts
- Middleware for auth is built-in
- TypeScript support is excellent
- Industry momentum behind App Router

**Tradeoffs:**
- Learning curve (Server vs Client components)
- SSR complexity (cookies, sessions)
- Some patterns not well-documented yet

### C.2 Why Supabase?

**Decision Date:** Project inception  
**Alternatives Considered:** Firebase, AWS Amplify, Prisma + raw Postgres  
**Chosen:** Supabase  
**Rationale:**
- PostgreSQL (not NoSQL) - better for relational data
- RLS policies built-in (security by default)
- Realtime subscriptions (for messaging)
- Auth included (JWT-based)
- Open source (can self-host if needed)

**Tradeoffs:**
- RLS can be slow at scale (need caching)
- Edge Functions (Deno) harder to debug
- Not as mature as Firebase

### C.3 Why Public Browsing?

**Decision Date:** Architecture planning  
**Alternatives Considered:** Login-wall all listings  
**Chosen:** Public browsing  
**Rationale:**
- SEO critical for acquisition
- Reduces signup friction
- Builds trust (see before you commit)
- Industry standard (Autotrader, Cars.com)

**Tradeoffs:**
- Must handle auth everywhere (more code)
- Personalization can't affect visibility
- Dealers can't see who's viewing

### C.4 Why Welcome Page as Transition?

**Decision Date:** December 2024 (auth race condition fix)  
**Alternatives Considered:** Direct navigation to /buyer/browse, using layout loading states  
**Chosen:** Public /welcome page  
**Rationale:**
- Solves auth hydration race condition
- Provides clear mental transition ("you're in")
- Allows loading state without blocking entire app
- No middleware complexity

**Tradeoffs:**
- Extra navigation step (UX friction)
- One more route to maintain
- Can't be skipped (would break flow)

### C.5 Why Three Supabase Clients?

**Decision Date:** Architecture planning  
**Alternatives Considered:** Single client, pass session manually  
**Chosen:** Three clients (browser, server, admin)  
**Rationale:**
- Browser client: safe for client-side, RLS enforced
- Server client: SSR-safe, reads cookies, RLS enforced
- Admin client: server-only, bypasses RLS, clearly dangerous

**Tradeoffs:**
- Must choose correct client (easy to get wrong)
- More code (three import paths)
- Admin client can leak if misused

---

## APPENDIX D: Glossary

**App Router:** Next.js 13+ routing system (vs Pages Router)  
**AuthContext:** Global React Context providing auth state  
**Buyer:** Individual looking to purchase a vehicle  
**CarlyScore:** Reputation score for dealers (0-100)  
**Carly Verified:** Highest marketplace tier (ready-to-go vehicles)  
**Dealer:** Licensed dealership selling inventory  
**Hydration:** Process of React attaching to server-rendered HTML  
**Middleware:** Next.js function that runs before every request  
**RLS:** Row-Level Security (Postgres feature for data access control)  
**Road Readiness State:** Vehicle condition classification (ready_to_go, needs_attention, major_repairs, as_is)  
**Server Component:** React component rendered on server (default in App Router)  
**SSR:** Server-Side Rendering  
**Supabase:** Backend-as-a-Service (PostgreSQL + Auth + Storage + Functions)  
**The Hub:** Middle marketplace tier (needs attention vehicles)  
**Builder's Market:** Lowest marketplace tier (as-is, major repairs)  
**Watchdog Timer:** Fail-safe to prevent infinite loading states  

---

**END OF MASTER ARCHITECTURE DOCUMENT**

This document is the canonical reference for the Carly platform. It should be updated when:
- Major architectural decisions are made
- New features are added or removed
- Known issues are resolved
- Production deployment state changes

**Maintainers:** Update the "Last Updated" date at the top when making changes.
