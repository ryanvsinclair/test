/**
 * ServerShell - Server-owned layout authority
 * 
 * This component runs on the server and decides which UI shell to render
 * based on the Supabase session. All layout-level decisions happen here.
 * 
 * CRITICAL: This ensures navbar, footer, and page shell switch atomically.
 */

import { ReactNode } from 'react';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import LoggedOutNav from './LoggedOutNav';
import BuyerNav from './BuyerNav';
import DealerNav from './DealerNav';
import { CarlyFooter } from '@/components/navigation/CarlyFooter';

interface ServerShellProps {
  children: ReactNode;
}

export default async function ServerShell({ children }: ServerShellProps) {
  // Detect special routes that don't need shell
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Auth and admin routes bypass shell completely
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  // Logged out shell (includes auth errors)
  if (error || !session) {
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
        {/* Dealers don't get footer */}
      </div>
    );
  }

  // Default: Buyer shell (or pending users)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BuyerNav />
      <main className="pt-16 flex-1">{children}</main>
      <CarlyFooter variant="buyer" />
    </div>
  );
}
