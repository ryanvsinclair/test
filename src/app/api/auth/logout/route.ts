import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/logout
 * 
 * Signs out user via Supabase Auth
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AUTH] Logout error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Logout exception:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
