/**
 * Auth Provider Integration (Supabase Auth)
 * 
 * Production-ready Supabase authentication integration.
 * All authentication flows use Supabase Auth.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface SignupParams {
  email: string;
  password: string;
  role: 'buyer' | 'dealer';
  fullName?: string;
  city?: string;
}

export interface SigninParams {
  email: string;
  password: string;
}

export interface PasswordChangeParams {
  userId: string;
  currentPassword?: string;
}

/**
 * Sign up a new user with full profile data
 * CRITICAL: For buyers, fullName and city are REQUIRED
 */
export async function signup(params: SignupParams): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    if (!supabase) {
      return { user: null, error: 'Authentication service unavailable. Please configure Supabase.' };
    }

    // VALIDATION: Buyer accounts must have full_name and city
    if (params.role === 'buyer') {
      if (!params.fullName || params.fullName.trim() === '') {
        return { user: null, error: 'Full name is required' };
      }
      if (!params.city || params.city.trim() === '') {
        return { user: null, error: 'City is required' };
      }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: { 
          role: params.role,
          full_name: params.fullName || '',
          city: params.city || '',
        },
      }
    });

    if (error) {
      console.error('[AUTH] Signup error:', error);
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Signup failed - no user returned' };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        emailVerified: data.user.email_confirmed_at !== null,
        twoFactorEnabled: false,
        createdAt: data.user.created_at,
      }
    };
  } catch (error) {
    console.error('[AUTH] Signup exception:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Signup failed' 
    };
  }
}

/**
 * Sign in existing user
 */
export async function signin(params: SigninParams): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      console.error('[AUTH] Signin error:', error);
      
      // User-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return { user: null, error: 'Invalid email or password' };
      }
      
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Signin failed - no user returned' };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        emailVerified: data.user.email_confirmed_at !== null,
        twoFactorEnabled: false,
        createdAt: data.user.created_at,
      }
    };
  } catch (error) {
    console.error('[AUTH] Signin exception:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Signin failed' 
    };
  }
}

/**
 * Sign out current user
 */
export async function signout(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[AUTH] Signout error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[AUTH] Signout exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Signout failed' 
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[AUTH] Get session error:', error);
      return { session: null, error: error.message };
    }

    return { session: data.session, error: null };
  } catch (error) {
    console.error('[AUTH] Get session exception:', error);
    return { 
      session: null, 
      error: error instanceof Error ? error.message : 'Failed to get session' 
    };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[AUTH] Get user error:', error);
      return { user: null, error: error.message };
    }

    if (!user) {
      return { user: null, error: null };
    }

    return {
      user: {
        id: user.id,
        email: user.email!,
        emailVerified: user.email_confirmed_at !== null,
        twoFactorEnabled: false,
        createdAt: user.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('[AUTH] Get user exception:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Failed to get user' 
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, redirectUrl?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
    });

    if (error) {
      console.error('[AUTH] Password reset error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[AUTH] Password reset exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Password reset failed' 
    };
  }
}

/**
 * Update password (requires current session)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('[AUTH] Password update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[AUTH] Password update exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Password update failed' 
    };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error('[AUTH] Verification email resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[AUTH] Verification email resend exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email resend failed' 
    };
  }
}

// Note: 2FA (MFA) features removed - not required for initial Supabase Auth integration
// Can be added later if needed using Supabase Auth MFA APIs

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one number or symbol');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
