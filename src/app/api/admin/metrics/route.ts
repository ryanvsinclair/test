import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase service role not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Count buyers
  const { count: buyersCount, error: buyersError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'buyer');

  if (buyersError) {
    return NextResponse.json(
      { error: buyersError.message },
      { status: 500 }
    );
  }

  // Count listings
  const { count: listingsCount, error: listingsError } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true });

  if (listingsError) {
    return NextResponse.json(
      { error: listingsError.message },
      { status: 500 }
    );
  }

  // Count messages
  const { count: messagesCount, error: messagesError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true });

  if (messagesError) {
    return NextResponse.json(
      { error: messagesError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    buyers: buyersCount || 0,
    listings: listingsCount || 0,
    messages: messagesCount || 0,
  });
}
