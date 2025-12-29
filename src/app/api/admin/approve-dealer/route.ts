/**
 * API Route: Approve Dealer Application
 * NEW FLOW: Dealer creates account first → admin approval ONLY updates metadata + status
 * NO MORE USER CREATION during approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { DealerApplicationStatus } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[APPROVE_DEALER] === START ===');
  
  try {
    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      console.log('[APPROVE_DEALER] Missing applicationId');
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    console.log('[APPROVE_DEALER] Processing applicationId:', applicationId);

    const supabaseAdmin = getSupabaseAdminClient();

    /**
     * STEP 1: Fetch application (service role bypasses RLS)
     */
    console.log('[APPROVE_DEALER] Step 1: Fetching application...');
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('dealer_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      console.error('[APPROVE_DEALER] Application not found:', fetchError);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    console.log('[APPROVE_DEALER] Application found:', {
      status: application.status,
      user_id: application.user_id,
      email: application.email,
    });

    /**
     * IDEMPOTENCY CHECK: If already approved, return 200
     */
    if (application.status === 'approved') {
      console.log('[APPROVE_DEALER] Application already approved');
      return NextResponse.json({ 
        success: true,
        message: 'Already approved',
      });
    }

    /**
     * STEP 2: Ensure application has user_id
     */
    let dealerUserId = application.user_id;
    
    if (!dealerUserId) {
      console.log('[APPROVE_DEALER] No user_id found, attempting to find by email:', application.email);
      
      // Try to find user by email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error('[APPROVE_DEALER] Failed to list users:', userError);
        return NextResponse.json(
          { error: 'Failed to verify user account' },
          { status: 500 }
        );
      }
      
      const existingUser = userData.users.find(u => 
        u.email?.toLowerCase() === application.email?.toLowerCase()
      );
      
      if (!existingUser) {
        console.error('[APPROVE_DEALER] No user account found for email:', application.email);
        return NextResponse.json(
          { 
            error: 'Dealer must create account first. Cannot approve without user account.',
            email: application.email,
          },
          { status: 409 }
        );
      }
      
      dealerUserId = existingUser.id;
      console.log('[APPROVE_DEALER] Found user by email, userId:', dealerUserId);
      
      // Update application with user_id
      await supabaseAdmin
        .from('dealer_applications')
        .update({ user_id: dealerUserId })
        .eq('id', applicationId);
    }

    /**
     * STEP 3: Update auth user metadata
     */
    console.log('[APPROVE_DEALER] Step 3: Updating user metadata for userId:', dealerUserId);
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      dealerUserId,
      {
        user_metadata: {
          role: 'dealer',
          dealer_status: 'approved',
          full_name: application.contact_name,
        },
      }
    );

    if (updateError) {
      console.error('[APPROVE_DEALER] Failed to update user metadata:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user account' },
        { status: 500 }
      );
    }

    console.log('[APPROVE_DEALER] User metadata updated successfully');

    /**
     * STEP 4: Upsert profiles (if needed)
     */
    console.log('[APPROVE_DEALER] Step 4: Upserting profile...');
    
    const { error: profileError } = await supabaseAdmin.rpc('upsert_dealer_profile', {
      p_id: dealerUserId,
      p_email: application.email,
      p_name: application.contact_name,
      p_role: 'dealer',
      p_dealer_status: 'approved',
    });

    if (profileError) {
      console.error('[APPROVE_DEALER] Profile upsert failed:', profileError);
      // Continue anyway - profile is secondary
    } else {
      console.log('[APPROVE_DEALER] Profile upserted successfully');
    }

    /**
     * STEP 5: Mark application as approved
     */
    console.log('[APPROVE_DEALER] Step 5: Marking application as approved...');
    
    const approvedStatus: DealerApplicationStatus = 'approved';
    const { error: statusUpdateError } = await supabaseAdmin
      .from('dealer_applications')
      .update({
        status: approvedStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (statusUpdateError) {
      console.error('[APPROVE_DEALER] Failed to update application status:', statusUpdateError);
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[APPROVE_DEALER] === SUCCESS === (${duration}ms)`);
    console.log('[APPROVE_DEALER] Dealer approved:', {
      applicationId,
      dealerUserId,
      email: application.email,
    });

    return NextResponse.json({ 
      success: true,
      dealerUserId,
    });

  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[APPROVE_DEALER] === ERROR === (${duration}ms)`);
    console.error('[APPROVE_DEALER] Caught exception:', err instanceof Error ? err.message : String(err));
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
