import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify user owns this dealership
  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_id')
    .eq('id', session.user.id)
    .single();
  
  if (profile?.dealership_id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const body = await request.json();
  
  // Update dealership to active
  const { error } = await supabase
    .from('dealerships')
    .update({
      lifecycle_status: 'active',
      operational_status: 'enabled',
      activated_at: new Date().toISOString(),
      branding: body.branding,
      payout_details: body.payoutDetails,
      business_hours: body.businessHours,
    })
    .eq('id', params.id)
    .eq('lifecycle_status', 'approved'); // Must be approved first
  
  if (error) {
    console.error('[DEALER ACTIVATION] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
