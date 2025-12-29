"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, dealership_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        router.push('/auth');
        return;
      }

      // Role-based redirect
      if (profile.role === 'dealer' && profile.dealership_id) {
        // Active dealer
        router.push('/dealer/dashboard');
      } else if (profile.role === 'dealer' && !profile.dealership_id) {
        // Dealer pending approval
        router.push('/auth/dealer/pending');
      } else {
        // Buyer (default)
        router.push('/browse');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
