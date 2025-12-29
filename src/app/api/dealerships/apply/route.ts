import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify user is a buyer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (profile?.role !== 'buyer') {
    return NextResponse.json({ error: 'Only buyers can apply' }, { status: 403 });
  }
  
  const body = await request.json();
  
  // Create dealership with pending status
  const { data, error } = await supabase
    .from('dealerships')
    .insert({
      lifecycle_status: 'pending',
      operational_status: 'disabled',
      contact_email: session.user.email,
      contact_name: body.contactName,
      contact_phone: body.contactPhone,
      legal_name: body.legalName,
      trade_name: body.tradeName || null,
      license_number: body.licenseNumber || null,
      dealership_type: body.dealershipType,
      city: body.city,
      region: body.region,
      country: body.country || 'CA',
      description: body.description,
      website_url: body.websiteUrl || null,
      additional_info: body.additionalInfo || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[DEALER APPLICATION] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, dealership: data });
}
