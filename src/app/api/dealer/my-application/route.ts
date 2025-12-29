/**
 * API Route: Get My Application
 * Authenticated dealer only - view their own application status
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Query by user_id only (never by email)
    const { data: application, error } = await supabase
      .from('dealer_applications')
      .select('id, status, created_at, dealership_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[MY_APPLICATION] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      );
    }

    // Return null if no application exists
    return NextResponse.json({ application: application || null });
    
  } catch (error: any) {
    console.error('[MY_APPLICATION] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
