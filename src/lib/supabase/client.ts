/**
 * Supabase Client (Browser)
 * 
 * Single shared Supabase client for browser-side authentication.
 * Used for client-side auth operations only.
 * 
 * CRITICAL: Use ANON_KEY only, never service role key.
 */

import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[SUPABASE] Missing environment variables. ' +
      'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to project settings.'
    );
    // Return a mock client that prevents app crashes
    return null as any;
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return supabaseInstance;
}

// Export alias for compatibility
export const createClient = getSupabaseBrowserClient;
