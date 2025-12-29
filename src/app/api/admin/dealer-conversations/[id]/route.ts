export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase service role not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  // Create SERVICE ROLE client (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('conversations')
    .select('id, buyer_id, listing_id, status, unread_count, last_message_at, created_at')
    .eq('dealer_id', params.id)
    .order('last_message_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    conversations: data ?? [],
  });
}
