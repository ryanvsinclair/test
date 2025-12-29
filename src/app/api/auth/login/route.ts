import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/login
 * 
 * Authenticates user via Supabase Auth
 * Note: Supabase handles session cookies automatically via SSR helpers
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AUTH] Login error:', error);
      
      // User-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 500 }
      );
    }

    // Get role from user metadata - NO DEFAULT
    const role = data.user.user_metadata?.role;
    
    // If no role, return error (should not happen with proper signup)
    if (!role) {
      return NextResponse.json(
        { error: 'Account not properly configured. Please contact support.' },
        { status: 403 }
      );
    }

    // TODO: If dealer, fetch dealer_status from database
    let dealerStatus: 'pending' | 'approved' | 'rejected' | undefined;
    if (role === 'dealer') {
      // For now, default to pending - replace with actual DB query
      dealerStatus = 'pending';
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
        role,
        verified: data.user.email_confirmed_at !== null,
        dealerStatus,
      },
    });
  } catch (error) {
    console.error('[AUTH] Login exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        dealerStatus: user.dealer_status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
