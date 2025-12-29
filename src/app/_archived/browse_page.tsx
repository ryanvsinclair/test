/**
 * /browse → / REDIRECT
 * 
 * ⚠️ CRITICAL: This route MUST NOT render Browse UI.
 * 
 * The canonical Browse page is at / (root).
 * This redirect ensures:
 * - No duplicate UI trees
 * - No hydration mismatches
 * - Single source of truth
 * 
 * DO NOT REMOVE THIS REDIRECT.
 * DO NOT ADD UI TO THIS FILE.
 * 
 * If you need to modify Browse, edit:
 * - src/app/page.tsx (the canonical route)
 * - src/app/browse/BrowseLoggedOut.tsx
 * - src/app/browse/BrowseLoggedIn.tsx
 */

import { redirect } from 'next/navigation';

export default function BrowseRedirect() {
  redirect('/');
}
