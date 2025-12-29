import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/inquiries/[id]/messages
 * 
 * Send a message in an inquiry thread
 * 
 * Security:
 * - Must be authenticated
 * - Buyers can message own inquiries
 * - Dealers can message dealership inquiries
 * - RLS enforces ownership
 * 
 * Request Body:
 * - message: string (required)
 * - isInternalNote: boolean (optional, dealer-only)
 */
export async function POST(
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
    const { message, isInternalNote } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }
    
    // Get profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, dealership_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
    }
    
    const senderRole = profile.role === 'dealer' ? 'dealer' : 'buyer';
    
    // Internal notes are dealer-only
    if (isInternalNote && senderRole !== 'dealer') {
      return NextResponse.json(
        { error: 'Only dealers can create internal notes' },
        { status: 403 }
      );
    }
    
    // Create message (RLS enforces access)
    const { data: newMessage, error: messageError } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: inquiryId,
        sender_id: session.user.id,
        sender_role: senderRole,
        message,
        is_internal_note: isInternalNote || false,
      })
      .select(`
        *,
        sender:profiles(id, name, email, role)
      `)
      .single();
    
    if (messageError) {
      console.error('[INQUIRY MESSAGE] Error creating message:', messageError);
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }
    
    // Trigger updates inquiry automatically via trigger
    
    return NextResponse.json({ 
      success: true, 
      message: newMessage 
    }, { status: 201 });
  } catch (error) {
    console.error('[INQUIRY MESSAGE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
