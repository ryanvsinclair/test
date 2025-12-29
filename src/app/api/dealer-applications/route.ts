/**
 * API Route: Submit Dealer Application
 * Requires authenticated session - dealer must create account first
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[APPLY] Received submission request');
  
  try {
    const supabase = await createClient();
    
    // Use getUser() instead of getSession() for proper auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[APPLY] No authenticated user');
      return NextResponse.json(
        { error: 'You must be logged in to apply' },
        { status: 401 }
      );
    }

    console.log('[APPLY] user id:', user.id);
    console.log('[APPLY] email:', user.email);

    const application = await request.json();

    const insertData = {
      user_id: user.id,
      email: user.email?.toLowerCase(),
      contact_name: application.contactName,
      phone: application.contactPhone || application.phone,
      dealership_name: application.dealershipName,
      dealership_type: application.dealershipType?.toLowerCase() || application.dealershipType,
      address: application.address,
      city: application.city,
      region: application.region,
      country: application.country,
      timezone: application.timezone,
      preferred_contact_method: application.preferredContactMethod,
      days_of_operation: application.daysOfOperation,
      opening_time: application.openingTime,
      closing_time: application.closingTime,
      special_notes: application.specialNotes,
      website_url: application.websiteUrl,
      instagram_url: application.instagramUrl,
      facebook_url: application.facebookUrl,
      tiktok_url: application.tiktokUrl,
      google_business_url: application.googleBusinessUrl,
      other_platforms: application.otherPlatforms,
      description: application.description,
      additional_info: application.additionalInfo,
      status: 'pending',
    };

    const { error } = await supabase
      .from('dealer_applications')
      .insert(insertData, { returning: 'minimal' });

    if (error) {
      console.error('[APPLY] Supabase error:', error);
      
      if (error.code === '23505') {
        console.log('[APPLY] Duplicate application for user:', user.id);
        return NextResponse.json(
          { error: 'You have already submitted an application.' },
          { status: 409 }
        );
      }

      if (error.code === '23502') {
        console.error('[APPLY] Not-null violation:', error.message);
        return NextResponse.json(
          { error: 'Missing required fields. Please complete all required information.' },
          { status: 400 }
        );
      }

      if (error.code === '22P02' || error.message?.includes('enum')) {
        console.error('[APPLY] Enum violation:', error.message);
        return NextResponse.json(
          { error: 'Invalid status or type value provided.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to submit application. Please try again.' },
        { status: 400 }
      );
    }

    console.log('[APPLY] Application submitted successfully for user:', user.id);
    return NextResponse.json({ success: true }, { status: 201 });
    
  } catch (error: any) {
    console.error('[APPLY] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
