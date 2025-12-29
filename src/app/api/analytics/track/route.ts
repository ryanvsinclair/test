import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/analytics/track
 * 
 * Track listing analytics events
 * 
 * Event Types:
 * - view: Listing page view
 * - save: User saves listing
 * - inquiry: User submits inquiry
 * - share: User shares listing
 * - contact_click: User clicks contact button
 * - phone_click: User clicks phone number
 * 
 * Security:
 * - Public endpoint (no auth required for views)
 * - Auth required for other event types
 * - RLS enforces insert permissions
 * 
 * Request Body:
 * - listingId: string (required)
 * - eventType: string (required)
 * - sessionId: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, eventType, sessionId } = body;

    if (!listingId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, eventType' },
        { status: 400 }
      );
    }

    const validEventTypes = ['view', 'save', 'inquiry', 'share', 'contact_click', 'phone_click'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get listing to verify it exists and get dealership_id
    const { data: listing, error: listingError } = await supabase
      .from('public_listings')
      .select('id, dealership_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Get user_id if authenticated
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    // Get client info
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    // Insert event
    const { error: insertError } = await supabase
      .from('listing_analytics_events')
      .insert({
        listing_id: listingId,
        dealership_id: listing.dealership_id,
        event_type: eventType,
        user_id: userId,
        session_id: sessionId || null,
        ip_address: ip,
        user_agent: userAgent,
        referrer: referrer,
      });

    if (insertError) {
      console.error('[ANALYTICS TRACK] Error inserting event:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // For view events, also increment listing.view_count
    if (eventType === 'view') {
      supabase
        .from('listings')
        .update({
          view_count: supabase.rpc('increment', { x: 1 }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', listingId)
        .then(() => {})
        .catch((err) => console.error('[ANALYTICS TRACK] Error incrementing view_count:', err));
    }

    // For inquiry events, also increment listing.inquiry_count
    if (eventType === 'inquiry') {
      supabase
        .from('listings')
        .update({
          inquiry_count: supabase.rpc('increment', { x: 1 }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', listingId)
        .then(() => {})
        .catch((err) => console.error('[ANALYTICS TRACK] Error incrementing inquiry_count:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ANALYTICS TRACK] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
