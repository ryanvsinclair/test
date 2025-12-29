# Carly - Three-State Architecture (Amended UX)

## Overview
Carly is a dual-sided automotive marketplace with three distinct identity-driven user states. The platform emphasizes **free exploration before authentication** while providing clear pathways to enhanced, role-specific experiences.

---

## User States

### STATE 0 — LOGGED OUT (Default State)
**Entry Point:** All users start here  
**Routes:** `/`, `/explore`  
**Purpose:** Teaser, trust engine, and discovery layer

**Design:**
- Apple × Tesla minimalism
- White/light grey with icy blue/purple accents
- Calm, premium motion

**Capabilities:**
✅ **Browse vehicle listings freely (read-only)**  
✅ View vehicle details  
✅ Search and filter vehicles  
✅ View dealer profiles (read-only)  
✅ See trust indicators  

**Restrictions:**
❌ No saving vehicles  
❌ No messaging dealers  
❌ No personalized features  
❌ No dashboard access  

**Entry Actions:**
- **"I'm looking for a vehicle"** → `/auth/buyer` → Buyer experience
- **"I'm a dealer"** → `/auth/dealer` → Dealer experience

**Key Principle:** Browsing is allowed without login. Authentication unlocks capabilities, not content.

---

### STATE 1 — LOGGED-IN BUYER
**Access:** Only via `/auth/buyer` login path  
**Routes:** `/buyer/*`  
**Purpose:** Personalized car-buying experience

**Design:**
- Minimal but warmer than logged-out
- Increased color usage
- Responsive motion and feedback
- Human-centric and assistive

**Capabilities:**
- Personalized vehicle feed
- Like/save vehicles
- Message dealers and sellers
- Schedule test drives
- View pricing insights
- Access comparisons and trust data

**Mental Model:** "This app works for me"

---

### STATE 2 — LOGGED-IN DEALER
**Access:** Only via `/auth/dealer` login path  
**Routes:** `/seller/*`  
**Purpose:** Business infrastructure for dealerships

**Design:**
- Dark/high-contrast theme (distinct from buyer UI)
- Data-dense, professional, efficient
- Less playful motion, more precision
- Tesla UI × Bloomberg terminal aesthetic

**Capabilities:**
- Inventory management
- Lead inbox and conversations
- Appointment scheduling
- Performance analytics
- Market intelligence
- Trust/certification status

**Mental Model:** "This app makes me money and saves me time"

---

## Architecture

### Key Principles
1. **Default state is always logged out**
2. **Two explicit authentication flows** (not auto-assigned)
3. **Role-driven layout switching** based on auth state + user role
4. **Shared data layer, separate presentation layers**
5. **No UI crossover** (dealers never see buyer UI, buyers never see dealer UI)

### Core Components

#### `/src/contexts/AuthContext.tsx`
Central authentication state management
- No localStorage persistence (always starts logged out)
- Login function accepts explicit role
- State flags: `isLoggedOut`, `isBuyer`, `isDealer`

#### `/src/components/layouts/StateRouter.tsx`
Top-level routing orchestrator
- Wraps all page content
- Renders appropriate navigation based on auth state
- Enforces route protection

#### `/src/components/layouts/RouteGuard.tsx`
Client-side route protection
- **Removed blocking of logged-out users from public routes**
- Prevents buyers from accessing dealer routes
- Prevents dealers from accessing buyer routes
- Redirects auth pages if already logged in

#### Navigation Components
- **LoggedOutNav**: Minimal, conversion-focused
- **BuyerNav**: Warm, personal, discovery-oriented
- **DealerNav**: Professional, data-dense, business-focused

### Authentication Flow

```
User lands → Default to STATE 0 (logged out)
    ↓
Clicks "Sign In"
    ↓
Modal shows two paths:
    ├─ "I'm looking for a vehicle" → /auth/buyer → Login as buyer → /buyer dashboard
    └─ "I'm a dealer" → /auth/dealer → Login as dealer → /seller dashboard
```

### Route Protection

| Route Pattern | Logged Out | Buyer | Dealer |
|--------------|------------|-------|--------|
| `/`, `/explore` | ✅ | ✅ | ✅ |
| `/auth/*` | ✅ | Redirect to dashboard | Redirect to dashboard |
| `/buyer/*` | Redirect to `/` | ✅ | Redirect to `/seller` |
| `/seller/*` | Redirect to `/` | Redirect to `/buyer` | ✅ |

### State Transitions

**Logout:**
- Clear user state
- Redirect to `/` (logged-out landing)

**Login:**
- Set user state with role
- Redirect to role-specific dashboard

**Cross-role access:**
- Automatically redirect to appropriate dashboard
- No manual role switching allowed

---

## Design Tokens

### Logged Out / Buyer
- Background: `bg-background` (white/light grey)
- Accents: `hsl(var(--accent-primary))`, `hsl(var(--accent-secondary))` (icy blue/purple)
- Motion: Smooth, responsive

### Dealer
- Background: `bg-[#0a0a0a]` (near black)
- Text: `text-white`, `text-white/60`
- Borders: `border-white/10`
- UI: `bg-white/5`, `hover:bg-white/10`
- Motion: Precise, efficient

---

## Implementation Notes

### Vehicle Browsing
- `/explore` page displays all vehicles with search/filter
- Logged-out users see full vehicle cards **without save buttons**
- Logged-in users see vehicle cards **with save buttons**
- Contextual CTA prompts logged-out users to sign in for enhanced features

### Logout Implementation
- Buyer logout button in profile dropdown
- Dealer logout button in settings bar
- Both redirect to `/` on logout
- Full state cleanup on logout

### Adding New Routes
1. Place buyer routes in `src/app/(buyer)/buyer/*`
2. Place dealer routes in `src/app/(seller)/seller/*`
3. RouteGuard automatically enforces protection

### Future Considerations
- Session persistence (when backend ready)
- Role verification from database
- Email verification flow
- Multi-factor authentication
- Dealer team member roles

---

## UX Principles Enforced

✅ **Browsing is allowed without login**  
✅ **Login unlocks capabilities, not content**  
✅ **Logout is always possible**  
✅ **No forced funnels**  
✅ **No role confusion**  
✅ **No UI reuse between buyer and dealer layouts**
