import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/signup
 * 
 * Create new user account via Supabase Auth
 */
export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'buyer' && role !== 'dealer') {
      return NextResponse.json(
        { error: 'Role must be "buyer" or "dealer"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (error) {
      console.error('[AUTH] Signup error:', error);
      
      // User-friendly error messages
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Signup failed' },
        { status: 500 }
      );
    }

    // TODO: If role is dealer, create entry in dealer_applications table with status 'pending'
    // TODO: Send welcome email

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
          emailVerified: data.user.email_confirmed_at !== null,
        },
        message: data.user.email_confirmed_at 
          ? 'Account created successfully' 
          : 'Please check your email to verify your account',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[AUTH] Signup exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
