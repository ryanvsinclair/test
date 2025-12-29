/**
 * DEPRECATED: This route redirects to /welcome
 * 
 * /buyer/welcome was moved to /welcome to avoid guarded route timing issues.
 * The welcome page is now public and auth-aware, not guarded.
 * 
 * See: src/app/welcome/page.tsx
 */

import { redirect } from 'next/navigation';

export default function BuyerWelcomePage() {
  redirect('/welcome');
}
