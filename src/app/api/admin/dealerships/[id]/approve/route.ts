import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const adminSupabase = getSupabaseAdminClient();
  
  // Verify admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.user_metadata?.is_admin !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get dealership
  const { data: dealership, error: dealershipError } = await adminSupabase
    .from('dealerships')
    .select('contact_email, lifecycle_status')
    .eq('id', params.id)
    .single();
  
  if (dealershipError || !dealership) {
    return NextResponse.json({ error: 'Dealership not found' }, { status: 404 });
  }

  // Check if already processed
  if (dealership.lifecycle_status !== 'pending') {
    return NextResponse.json({ 
      error: `Application already processed (${dealership.lifecycle_status})` 
    }, { status: 400 });
  }
  
  // Find user by email
  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('email', dealership.contact_email)
    .single();
  
  if (profileError || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  // ATOMIC APPROVAL
  // 1. Update dealership
  const { error: updateDealershipError } = await adminSupabase
    .from('dealerships')
    .update({
      lifecycle_status: 'approved',
      approved_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq('id', params.id);

  if (updateDealershipError) {
    console.error('[ADMIN APPROVE] Error updating dealership:', updateDealershipError);
    return NextResponse.json({ error: updateDealershipError.message }, { status: 500 });
  }
  
  // 2. Update profile (buyer → dealer, link dealership)
  const { error: updateProfileError } = await adminSupabase
    .from('profiles')
    .update({
      role: 'dealer',
      dealership_id: params.id,
    })
    .eq('id', profile.id);

  if (updateProfileError) {
    console.error('[ADMIN APPROVE] Error updating profile:', updateProfileError);
    // Rollback dealership update
    await adminSupabase
      .from('dealerships')
      .update({ lifecycle_status: 'pending', approved_at: null, reviewed_by: null })
      .eq('id', params.id);
    
    return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
