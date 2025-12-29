import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/session
 * 
 * Returns current Supabase session data
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AUTH] Session check error:', error);
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get role from user metadata - NO DEFAULT
    const role = session.user.user_metadata?.role;
    
    // If no role, return null user (invalid account)
    if (!role) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // TODO: If dealer, fetch dealer_status from database
    let dealerStatus: 'pending' | 'approved' | 'rejected' | undefined;
    if (role === 'dealer') {
      dealerStatus = 'pending';
    }
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
        role,
        verified: session.user.email_confirmed_at !== null,
        dealerStatus,
      },
    });
  } catch (error) {
    console.error('[AUTH] Session check exception:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
