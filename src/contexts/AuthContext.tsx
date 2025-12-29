"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { savedVehiclesAPI } from "@/lib/api/saved-vehicles";
import { User } from "@/types";

/* ============================================================
   Types
============================================================ */

type AuthState = {
  user: User | null;
  isLoading: boolean;

  // Tri-state auth flags
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  isLoggedOut: boolean; // alias

  // Role flags
  isBuyer: boolean;
  isDealer: boolean;
  isDealerApproved: boolean;
  isAdmin: boolean;

  // Saved vehicles
  savedVehicleIds: Set<string>;
  saveVehicle: (id: string) => Promise<void>;
  unsaveVehicle: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/* ============================================================
   Provider
============================================================ */

export function AuthProvider({ children }: { children: ReactNode }) {
  // 🔒 Stable Supabase client (NON-NEGOTIABLE)
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedVehicleIds, setSavedVehicleIds] = useState<Set<string>>(new Set());

  // 🔐 REAL mutex (persists across renders)
  const hydrationRef = useRef(false);

  /* ============================================================
     Session → User resolution (NON-BLOCKING)
  ============================================================ */

  async function resolveSession(session: Session | null) {
    console.log('[AUTH-CONTEXT] 🔵 resolveSession called', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
    });

    if (!session?.user) {
      console.log('[AUTH-CONTEXT] 🔴 No session, clearing user');
      setUser(null);
      setIsAdmin(false);
      return;
    }

    // Prevent concurrent hydration (BroadcastChannel, StrictMode)
    if (hydrationRef.current) {
      console.log('[AUTH-CONTEXT] 🟡 Hydration already in progress, skipping');
      return;
    }
    hydrationRef.current = true;
    console.log('[AUTH-CONTEXT] 🔵 Starting user resolution');

    try {
      const isAdminFlag = session.user.user_metadata?.is_admin === true;
      setIsAdmin(isAdminFlag);

      // OPTIONAL enrichment — MUST NEVER BLOCK AUTH
      console.log('[AUTH-CONTEXT] 🔵 Fetching profile...');
      
      const profilePromise = supabase
        .from("profiles")
        .select("role, dealership_id, name, verified")
        .eq("id", session.user.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );

      let profile = null;
      let profileError = null;

      try {
        const result = await Promise.race([profilePromise, timeoutPromise]);
        profile = (result as any).data;
        profileError = (result as any).error;
      } catch (err: any) {
        if (err.message === 'Profile fetch timeout') {
          console.warn('[AUTH-CONTEXT] 🟡 Profile fetch timeout (3000ms), using fallback');
        } else {
          console.warn('[AUTH-CONTEXT] 🟡 Profile query failed (non-blocking):', err.message || err);
        }
        profileError = err;
      }

      if (profileError && profileError.message !== 'Profile fetch timeout') {
        console.warn('[AUTH-CONTEXT] 🟡 Profile error (non-blocking):', { code: profileError.code, message: profileError.message });
      }

      // Self-healing: if no profile exists, attempt to create one
      if (!profile && !profileError) {
        console.log('[AUTH-CONTEXT] 🟡 No profile found, attempting self-heal...');
        try {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              role: session.user.user_metadata?.role ?? 'buyer',
              name: session.user.user_metadata?.full_name ?? session.user.email!.split("@")[0],
              email: session.user.email
            })
            .select()
            .single();

          if (!insertError) {
            console.log('[AUTH-CONTEXT] 🟢 Profile self-heal successful');
            const { data: newProfile } = await supabase
              .from("profiles")
              .select("role, dealership_id, name, verified")
              .eq("id", session.user.id)
              .maybeSingle();
            profile = newProfile;
          } else {
            console.warn('[AUTH-CONTEXT] 🟡 Profile self-heal failed (non-blocking):', insertError.message);
          }
        } catch (healErr) {
          console.warn('[AUTH-CONTEXT] 🟡 Profile self-heal exception (non-blocking):', healErr);
        }
      }

      console.log('[AUTH-CONTEXT] 🟢 Profile fetched', { role: profile?.role, verified: profile?.verified, hasProfile: !!profile });

      const role =
        profile?.role ??
        session.user.user_metadata?.role ??
        "buyer";

      const userObject = {
        id: session.user.id,
        email: session.user.email!,
        name:
          profile?.name ??
          session.user.user_metadata?.full_name ??
          session.user.email!.split("@")[0],
        role,
        verified: profile?.verified ?? false,
        dealershipId: profile?.dealership_id ?? null,
        createdAt: session.user.created_at!,
      };

      console.log('[AUTH-CONTEXT] 🟢 Setting user', { userId: userObject.id, role: userObject.role });
      setUser(userObject);
    } catch (err) {
      console.error('[AUTH-CONTEXT] 🔴 Error resolving session, using fallback', err);
      // Absolute fallback — UI MUST UNBLOCK
      setUser({
        id: session!.user.id,
        email: session!.user.email!,
        name: session!.user.email!.split("@")[0],
        role: "buyer",
        verified: false,
        dealershipId: null,
        createdAt: session!.user.created_at!,
      });
    } finally {
      hydrationRef.current = false;
      console.log('[AUTH-CONTEXT] 🔵 resolveSession complete');
    }
  }

  /* ============================================================
     BOOT: resolve initial session (GUARANTEED EXIT)
  ============================================================ */

  useEffect(() => {
    console.log('[AUTH-CONTEXT] 🔵 Provider mounted, initializing auth');
    let alive = true;

    // ⏱ Hard watchdog — app can NEVER hang
    const watchdogStart = Date.now();
    const watchdog = setTimeout(() => {
      const elapsed = Date.now() - watchdogStart;
      console.warn(`[AUTH-CONTEXT] 🟡 Watchdog fired after ${elapsed}ms — forcing isLoading=false`);
      if (alive) {
        console.warn('[AUTH-CONTEXT] 🟡 Watchdog context: initial boot phase (non-critical)');
        setIsLoading(false);
      }
    }, 6000);

    (async () => {
      try {
        console.log('[AUTH-CONTEXT] 🔵 Calling getSession()...');
        const { data } = await supabase.auth.getSession();
        console.log('[AUTH-CONTEXT] 🟢 getSession() returned', { hasSession: !!data.session, userId: data.session?.user?.id });
        if (!alive) return;
        await resolveSession(data.session);
      } catch (e) {
        console.error("[AUTH-CONTEXT] 🔴 getSession failed", e);
      } finally {
        clearTimeout(watchdog);
        console.log('[AUTH-CONTEXT] 🔵 Setting isLoading = false (initial hydration complete)');
        if (alive) setIsLoading(false);
      }
    })();

    // Auth event listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH-CONTEXT] 🟡 Auth state change event:', event, { userId: session?.user?.id });
      setIsLoading(true);
      await resolveSession(session);
      console.log('[AUTH-CONTEXT] 🔵 Setting isLoading = false (after state change)');
      setIsLoading(false);
    });

    return () => {
      console.log('[AUTH-CONTEXT] 🔵 Provider unmounting');
      alive = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, [supabase]);

  /* ============================================================
     Saved vehicles (post-auth, never blocks boot)
  ============================================================ */

  useEffect(() => {
    if (!user || user.role !== "buyer") {
      setSavedVehicleIds(new Set());
      return;
    }

    savedVehiclesAPI
      .getSavedVehicleIds(user.id)
      .then(ids => setSavedVehicleIds(new Set(ids)))
      .catch(() => setSavedVehicleIds(new Set()));
  }, [user]);

  /* ============================================================
     Actions
  ============================================================ */

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    await supabase.auth.signInWithPassword({ email, password });
    // Trigger server re-render to switch shell
    router.refresh();
    // onAuthStateChange handles the rest
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

  const saveVehicle = async (id: string) => {
    if (!user || user.role !== "buyer") return;
    await savedVehiclesAPI.saveVehicle(user.id, id);
    setSavedVehicleIds(v => new Set([...v, id]));
  };

  const unsaveVehicle = async (id: string) => {
    if (!user || user.role !== "buyer") return;
    await savedVehiclesAPI.unsaveVehicle(user.id, id);
    setSavedVehicleIds(v => {
      const n = new Set(v);
      n.delete(id);
      return n;
    });
  };

  /* ============================================================
     Derived flags (TRI-STATE)
  ============================================================ */

  const isAuthenticated = !isLoading && !!user;
  const isUnauthenticated = !isLoading && !user;
  const isLoggedOut = isUnauthenticated;

  const isBuyer = user?.role === "buyer";
  const isDealer = user?.role === "dealer";
  const isDealerApproved = user?.role === "dealer" && !!user.dealershipId;

  /* ============================================================
     Provider
  ============================================================ */

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isUnauthenticated,
        isLoggedOut,
        isBuyer,
        isDealer,
        isDealerApproved,
        isAdmin,
        savedVehicleIds,
        saveVehicle,
        unsaveVehicle,
        isSaved: id => savedVehicleIds.has(id),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   Hook
============================================================ */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
