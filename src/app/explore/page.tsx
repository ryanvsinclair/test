/**
 * DEPRECATED: This route is archived
 * 
 * /explore was consolidated into /browse as part of marketplace unification.
 * All /explore traffic now redirects to /browse.
 * 
 * See: src/app/_deprecated/explore/DEPRECATED.md
 */

import { redirect } from 'next/navigation';

export default function ExplorePage() {
  redirect('/browse');
}
