'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyerDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/buyer/browse');
  }, [router]);
  
  return null;
}
