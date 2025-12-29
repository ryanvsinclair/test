import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/inquiries/[id]
 * 
 * Get inquiry details with messages
 * 
 * Security:
 * - Must be authenticated
 * - Buyers can view own inquiries
 * - Dealers can view dealership inquiries
 * - RLS enforces ownership
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const inquiryId = params.id;
    
    // Get inquiry (RLS enforces access)
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select(`
        *,
        listing:listings(id, year, make, model, trim, price, primary_image_url),
        buyer:profiles!inquiries_buyer_id_fkey(id, name, email)
      `)
      .eq('id', inquiryId)
      .single();
    
    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get messages (RLS enforces access, filters internal notes for buyers)
    const { data: messages, error: messagesError } = await supabase
      .from('inquiry_messages')
      .select(`
        *,
        sender:profiles(id, name, email, role)
      `)
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('[INQUIRY GET] Error fetching messages:', messagesError);
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      inquiry,
      messages: messages || [],
    });
  } catch (error) {
    console.error('[INQUIRY GET] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/inquiries/[id]
 * 
 * Update inquiry status
 * 
 * Security:
 * - Must be authenticated
 * - Dealers can update dealership inquiries
 * - Buyers cannot update status
 * - RLS enforces ownership
 * 
 * Request Body:
 * - status: 'open' | 'replied' | 'closed'
 * - priority: 'low' | 'normal' | 'high' | 'urgent' (optional)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const inquiryId = params.id;
    const body = await request.json();
    const { status, priority } = body;
    
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (status) {
      if (!['open', 'replied', 'closed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: open, replied, or closed' },
          { status: 400 }
        );
      }
      updates.status = status;
      
      if (status === 'closed') {
        updates.closed_at = new Date().toISOString();
        updates.closed_by = session.user.id;
      }
    }
    
    if (priority) {
      if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority. Must be: low, normal, high, or urgent' },
          { status: 400 }
        );
      }
      updates.priority = priority;
    }
    
    // Update inquiry (RLS enforces dealer access)
    const { data: inquiry, error: updateError } = await supabase
      .from('inquiries')
      .update(updates)
      .eq('id', inquiryId)
      .select()
      .single();
    
    if (updateError) {
      console.error('[INQUIRY UPDATE] Error updating inquiry:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error('[INQUIRY UPDATE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
