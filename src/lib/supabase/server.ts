/**
 * Supabase Client (Server - User Context)
 * 
 * Server-side Supabase client for API routes and server components.
 * Uses cookies for session management - acts "as the authenticated user".
 * 
 * CRITICAL: This client ENFORCES RLS policies
 * - Uses anon key + user session cookies
 * - All queries run with user's permissions
 * - Respects all RLS policies defined in database
 * 
 * Use this for:
 * - User-facing read/write operations
 * - Any operation that should respect user permissions
 * - Any operation in API routes/server actions
 * 
 * Do NOT use this for:
 * - Admin operations (use admin client instead)
 * - System operations that need to bypass RLS
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[SUPABASE SERVER] Missing environment variables. ' +
      'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to project settings.'
    );
    throw new Error('Supabase configuration error');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Handle cookie setting errors in middleware
        }
      },
    },
  });
}

// Alias for backward compatibility
export const getSupabaseServerClient = createClient;
