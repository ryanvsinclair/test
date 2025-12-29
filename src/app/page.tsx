/**
 * ROOT PAGE: / (CANONICAL BROWSE ROUTE)
 * 
 * ⚠️ CRITICAL: This is the ONLY Browse page. Do NOT create duplicate UI in /browse.
 * 
 * Instagram-style routing: Root URL renders Browse experience directly.
 * 
 * - URL stays "/" - no redirects
 * - Server-side session detection
 * - Logged-out users see public browse
 * - Logged-in users see personalized browse
 * 
 * Architecture:
 * - Server component detects session
 * - Renders appropriate Browse variant
 * - No route changes based on auth
 */

import { createClient } from '@/lib/supabase/server';
import BrowseLoggedOut from './browse/BrowseLoggedOut';
import BrowseLoggedIn from './browse/BrowseLoggedIn';

export default async function RootPage() {
  const supabase = await createClient();
  
  // Safely handle session errors (expired/invalid tokens)
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return <BrowseLoggedOut />;
  }

  return <BrowseLoggedIn userId={session.user.id} />;
}
