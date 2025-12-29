/**
 * Supabase Admin Client (Service Role)
 * 
 * CRITICAL SECURITY:
 * - This client BYPASSES ALL RLS policies
 * - MUST only be used in server-side contexts
 * - NEVER import this in any file that could be bundled for the browser
 * 
 * Valid use cases:
 * - Admin operations (approve dealer applications)
 * - System operations (create profiles on signup)
 * - Scheduled tasks (cleanup, migrations)
 * 
 * Invalid use cases:
 * - Any user-facing read/write operations (use server client instead)
 * - Any operation that should respect RLS (use server client instead)
 */

import { createClient } from '@supabase/supabase-js';

// Runtime check: throw if executed in browser
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 SECURITY VIOLATION: Admin client cannot be used in browser. ' +
    'This file should never be imported by client-side code.'
  );
}

let adminClientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  // Return cached instance if exists
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      '[SUPABASE ADMIN] Missing environment variables. ' +
      'Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to project settings.'
    );
    throw new Error('Admin client configuration error');
  }

  // Service role key validation removed - Tempo provides valid keys via env vars

  adminClientInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });

  return adminClientInstance;
}

// Export alias for clarity
export const createAdminClient = getSupabaseAdminClient;

/**
 * Helper to verify this is running server-side
 * Call at top of any function using admin client
 */
export function ensureServerSide(context: string) {
  if (typeof window !== 'undefined') {
    throw new Error(
      `🚨 SECURITY VIOLATION: ${context} attempted to run in browser. ` +
      'Admin operations must only run server-side.'
    );
  }
}
