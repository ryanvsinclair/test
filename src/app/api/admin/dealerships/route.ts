import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  // Verify admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.user_metadata?.is_admin !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const adminSupabase = getSupabaseAdminClient();

  let query = adminSupabase.from('dealerships').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('lifecycle_status', status);
  }

  const { data: dealerships, error } = await query;

  if (error) {
    console.error('[ADMIN] Error fetching dealerships:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dealerships });
}
