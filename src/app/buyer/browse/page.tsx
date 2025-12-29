/**
 * DEPRECATED: This route redirects to /browse
 * 
 * /buyer/browse was deprecated as part of marketplace consolidation.
 * /browse is now the single canonical marketplace for all users.
 * 
 * See: src/app/browse/page.tsx
 */

import { redirect } from 'next/navigation';

export default function BuyerBrowsePage() {
  redirect('/browse');
}
