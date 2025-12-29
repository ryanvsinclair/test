import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/inquiries/create
 * 
 * Create a new inquiry (buyer → dealer)
 * 
 * Security:
 * - Must be authenticated
 * - Creates inquiry with buyer_id = auth.uid()
 * - RLS enforces buyer ownership
 * 
 * Request Body:
 * - listingId: string (required)
 * - subject: string (optional)
 * - message: string (required)
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { listingId, subject, message } = body;
    
    if (!listingId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, message' },
        { status: 400 }
      );
    }
    
    // Get listing to verify it exists and get dealership_id
    const { data: listing, error: listingError } = await supabase
      .from('public_listings')
      .select('id, dealership_id, year, make, model')
      .eq('id', listingId)
      .single();
    
    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Create inquiry
    const defaultSubject = subject || `Inquiry about ${listing.year} ${listing.make} ${listing.model}`;
    
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        listing_id: listingId,
        dealership_id: listing.dealership_id,
        buyer_id: session.user.id,
        subject: defaultSubject,
        status: 'open',
        message_count: 1,
        buyer_message_count: 1,
      })
      .select()
      .single();
    
    if (inquiryError) {
      console.error('[INQUIRY CREATE] Error creating inquiry:', inquiryError);
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }
    
    // Create first message
    const { error: messageError } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: inquiry.id,
        sender_id: session.user.id,
        sender_role: 'buyer',
        message,
      });
    
    if (messageError) {
      console.error('[INQUIRY CREATE] Error creating message:', messageError);
      // Rollback inquiry
      await supabase.from('inquiries').delete().eq('id', inquiry.id);
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }
    
    // Track analytics event
    fetch(new URL('/api/analytics/track', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        eventType: 'inquiry',
      }),
    }).catch((err) => console.error('[INQUIRY CREATE] Analytics error:', err));
    
    return NextResponse.json({ 
      success: true, 
      inquiry 
    }, { status: 201 });
  } catch (error) {
    console.error('[INQUIRY CREATE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
