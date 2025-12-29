# Auth Authority Split Fix - Implementation Report

## Problem Identified

**Critical UI Mismatch:**
- User successfully authenticates (Supabase session exists)
- Footer updates to show logged-in links
- Navbar and main page content remain in logged-out state

**Root Cause:**
Different parts of the UI were being controlled by different auth authorities:
- Footer: Reading from client-side AuthContext
- Navbar: Rendered by client-side StateRouter using AuthContext
- Page content: Server-rendered

This violated App Router invariants where server components do NOT re-render when client auth state changes.

---

## Files Changed

### 1. **src/components/navigation/CarlyFooter.tsx**

**Before:**
```typescript
export function CarlyFooter() {
  const { user } = useAuth();
  const isDealerView = user?.role === 'dealer';
```

**After:**
```typescript
interface CarlyFooterProps {
  variant?: 'logged-out' | 'buyer' | 'dealer';
}

export function CarlyFooter({ variant = 'logged-out' }: CarlyFooterProps) {
  const isDealerView = variant === 'dealer';
  const showNavigateSection = variant !== 'dealer';
  const showAuthenticatedLinks = variant === 'buyer';
```

**Change:** Footer is now "dumb" and receives a variant prop instead of reading auth state directly.

---

### 2. **src/components/layouts/ServerShell.tsx** (NEW)

**Purpose:** Server-owned layout authority that decides which nav/footer to render based on session.

**Key Logic:**
```typescript
export default async function ServerShell({ children }: ServerShellProps) {
  // Detect special routes that don't need shell
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Auth and admin routes bypass shell completely
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Logged out shell
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LoggedOutNav />
        <main className="flex-1">{children}</main>
        <CarlyFooter variant="logged-out" />
      </div>
    );
  }

  // Fetch user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, dealer_application_status')
    .eq('id', session.user.id)
    .single();

  // Dealer shell
  if (profile?.role === 'dealer' && profile?.dealer_application_status === 'approved') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DealerNav />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Default: Buyer shell
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BuyerNav />
      <main className="pt-16 flex-1">{children}</main>
      <CarlyFooter variant="buyer" />
    </div>
  );
}
```

---

### 3. **src/app/layout.tsx**

**Before:**
```typescript
import StateRouter from "@/components/layouts/StateRouter";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <UnitsProvider>
              <StateRouter>
                {children}
              </StateRouter>
            </UnitsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**After:**
```typescript
import ServerShell from "@/components/layouts/ServerShell";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <UnitsProvider>
              <RouteGuard>
                <ServerShell>
                  {children}
                </ServerShell>
              </RouteGuard>
            </UnitsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Change:** StateRouter (client-side) replaced with ServerShell (server-side).

---

### 4. **middleware.ts**

**Change:** Added `x-pathname` header to pass pathname to ServerShell.

```typescript
// For public routes
const response = NextResponse.next();
response.headers.set('x-pathname', pathname);
return response;

// For protected routes (end of middleware)
response.headers.set('x-pathname', pathname);
return response;
```

---

### 5. **src/contexts/AuthContext.tsx**

**Before:**
```typescript
const logout = async () => {
  setIsLoading(true);
  await supabase.auth.signOut();
  setUser(null);
  setSavedVehicleIds(new Set());
  setIsLoading(false);
};
```

**After:**
```typescript
const router = useRouter();

const login = async (email: string, password: string) => {
  setIsLoading(true);
  await supabase.auth.signInWithPassword({ email, password });
  // Trigger server re-render to switch shell
  router.refresh();
};

const logout = async () => {
  setIsLoading(true);
  await supabase.auth.signOut();
  setUser(null);
  setSavedVehicleIds(new Set());
  setIsLoading(false);
  // Trigger server re-render to switch shell
  router.refresh();
  router.replace('/');
};
```

**Change:** Added `router.refresh()` after login/logout to trigger server re-render, causing ServerShell to re-evaluate and switch nav/footer atomically.

---

## Deprecated Files

### **src/components/layouts/StateRouter.tsx**

**Status:** No longer used (replaced by ServerShell).

**Reason:** Client-side routing logic cannot reliably trigger server component re-renders.

---

## Architecture Changes

### Before (Client-Owned Layout):
```
Root Layout
  ├─ AuthProvider (client)
  └─ StateRouter (client)
      ├─ Reads useAuth()
      ├─ Decides which nav/footer
      └─ Renders children
```

**Problem:** Nav/footer decisions made client-side, don't sync with server session state.

---

### After (Server-Owned Layout):
```
Root Layout (server)
  ├─ ServerShell (server)
  │   ├─ Reads session from server
  │   ├─ Decides which nav/footer
  │   └─ Renders correct shell
  └─ AuthProvider (client)
      └─ Used for UI interactivity ONLY
```

**Solution:** Layout decisions made server-side, nav/footer switch atomically on login/logout.

---

## Auth Authority Rules (ENFORCED)

### Server Authority (ServerShell):
- ✅ Which navbar to render
- ✅ Which footer to render
- ✅ Which page shell to render
- ✅ Layout-level decisions

### Client Authority (AuthContext):
- ✅ Button interactivity (save, message, etc.)
- ✅ Personalization logic within pages
- ✅ UI state (loading spinners, etc.)
- ❌ Layout decisions (nav/footer)
- ❌ Route guarding (middleware handles this)

---

## Login/Logout Flow

### Login:
1. User submits credentials
2. `AuthContext.login()` calls Supabase
3. `router.refresh()` triggers server re-render
4. ServerShell re-evaluates session
5. ServerShell switches from LoggedOutNav → BuyerNav
6. Footer switches from variant="logged-out" → variant="buyer"
7. **Nav, footer, and page content switch atomically**

### Logout:
1. User clicks logout
2. `AuthContext.logout()` calls Supabase
3. `router.refresh()` triggers server re-render
4. `router.replace('/')` navigates to home
5. ServerShell re-evaluates session
6. ServerShell switches from BuyerNav → LoggedOutNav
7. Footer switches from variant="buyer" → variant="logged-out"
8. **Nav, footer, and page content switch atomically**

---

## Verification Checklist

### Login Flow:
- [ ] Logged-out user sees LoggedOutNav + "logged-out" footer
- [ ] User logs in
- [ ] **IMMEDIATELY** after login, nav switches to BuyerNav
- [ ] **IMMEDIATELY** after login, footer shows authenticated links
- [ ] **IMMEDIATELY** after login, page content updates
- [ ] No stale UI (no footer showing logged-in while nav shows logged-out)

### Logout Flow:
- [ ] Logged-in buyer sees BuyerNav + "buyer" footer
- [ ] User logs out
- [ ] **IMMEDIATELY** after logout, nav switches to LoggedOutNav
- [ ] **IMMEDIATELY** after logout, footer hides authenticated links
- [ ] **IMMEDIATELY** after logout, page content updates
- [ ] Redirected to `/` (home)

### Refresh Behavior:
- [ ] Hard refresh while logged out → correct logged-out shell
- [ ] Hard refresh while logged in → correct buyer shell
- [ ] No hydration errors
- [ ] No layout flashes

### Special Routes:
- [ ] `/auth` pages render without nav/footer
- [ ] `/admin` pages use AdminLayout (bypass ServerShell)
- [ ] Dealer-approved users see DealerNav (no footer)

---

## Success Criteria

✅ **Nav + Footer + Page always switch together**  
✅ **No part of the UI upgrades independently**  
✅ **Logged-in UI appears immediately after login**  
✅ **Refresh preserves correct state**  
✅ **AuthContext used for UI interactivity ONLY**  
✅ **ServerShell owns all layout decisions**  

---

## Implementation Date

December 29, 2024

## Status

✅ **Complete** - Ready for testing

---

## Files Improperly Using AuthContext for Layout (Fixed)

### Fixed:
1. ✅ `src/components/navigation/CarlyFooter.tsx` - Now accepts variant prop
2. ✅ `src/components/layouts/StateRouter.tsx` - Deprecated (replaced by ServerShell)

### Still Using AuthContext (Correctly):
- `src/app/browse/BrowseLoggedIn.tsx` - UI interactivity ✅
- `src/app/buyer/garage/page.tsx` - UI interactivity ✅
- `src/app/buyer/messages/page.tsx` - UI interactivity ✅
- `src/app/buyer/profile/page.tsx` - UI interactivity ✅
- `src/components/layouts/BuyerNav.tsx` - Only for logout button ✅

---

## Next Steps

1. Test login flow (logged-out → logged-in)
2. Test logout flow (logged-in → logged-out)
3. Test hard refresh in both states
4. Verify no hydration errors
5. Verify dealer shell works correctly
6. Remove or archive StateRouter.tsx if no longer needed
