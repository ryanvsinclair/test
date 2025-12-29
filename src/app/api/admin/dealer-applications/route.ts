/**
 * API Route: Admin - List All Dealer Applications
 * Uses service role to bypass RLS
 * Admin-only endpoint
 */
console.log('[SYSTEM] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('\n========== AUDIT: DEALER APPLICATIONS API ==========');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[AUDIT] Missing Supabase env vars');
    return NextResponse.json(
      { error: 'Supabase service role not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('[ADMIN] Executing SELECT on dealer_applications...');

  const { data, error } = await supabase
    .from('dealer_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN] Query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[ADMIN] Rows returned:', data?.length ?? 0);

  if (data?.length) {
    console.log('[ADMIN] Sample row:', {
      id: data[0].id,
      email: data[0].email,
      contact_name: data[0].contact_name,
      dealership_name: data[0].dealership_name,
      status: data[0].status,
    });
  }

  console.log('========== END AUDIT ==========\n');

  return NextResponse.json({ applications: data || [] });
}
