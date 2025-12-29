"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signin, signup } from "@/lib/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { CitySearch } from "@/components/ui/city-search";
import { City } from "@/lib/api/cities";

export default function UnifiedAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AUTH-PAGE] 🔵 Sign in form submitted', { email });
    setError("");
    setLoading(true);

    try {
      console.log('[AUTH-PAGE] 🔵 Calling signin()...');
      const result = await signin({ email, password });
      console.log('[AUTH-PAGE] 🟢 Signin result', { success: !result.error, userId: result.user?.id });
      
      if (result.error) {
        console.log('[AUTH-PAGE] 🔴 Signin error:', result.error);
        setError(result.error);
        setLoading(false);
        return;
      }

      console.log('[AUTH-PAGE] 🔵 BEFORE router.push("/auth/redirect")');
      // Auth successful - role resolution happens server-side
      // User will be redirected based on their actual role from profiles table
      router.push('/auth/redirect');
      console.log('[AUTH-PAGE] 🔵 AFTER router.push("/auth/redirect")');
    } catch (err: any) {
      console.error('[AUTH-PAGE] 🔴 Exception in handleSignIn:', err);
      setError(err.message || "Sign in failed");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AUTH-PAGE] 🔵 Sign up form submitted', { email, fullName });
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!fullName || fullName.trim() === "") {
      setError("Full name is required");
      return;
    }

    if (!selectedCity) {
      setError("City is required");
      return;
    }

    setLoading(true);
    console.log('[AUTH-PAGE] 🔵 Starting signup...');

    try {
      const result = await signup({ 
        email, 
        password,
        role: 'buyer', // All new users start as buyers
        fullName: fullName.trim(),
        city: `${selectedCity.name}, ${selectedCity.region}`, // Format: "City, Region"
      });
      
      console.log('[AUTH-PAGE] 🟢 Signup result', { success: !result.error });

      if (result.error) {
        console.log('[AUTH-PAGE] 🔴 Signup error:', result.error);
        setError(result.error);
        setLoading(false);
        return;
      }

      console.log('[AUTH-PAGE] 🔵 Auto-login after signup...');
      // Auto sign-in after signup
      const loginResult = await signin({ email, password });
      console.log('[AUTH-PAGE] 🟢 Auto-login result', { success: !loginResult.error, userId: loginResult.user?.id });
      
      if (loginResult.error) {
        console.log('[AUTH-PAGE] 🔴 Auto-login failed');
        setError('Account created. Please sign in.');
        setMode('signin');
        setLoading(false);
        return;
      }

      console.log('[AUTH-PAGE] 🔵 BEFORE router.push("/auth/intent")');
      // Redirect to intent selection
      router.push('/auth/intent');
      console.log('[AUTH-PAGE] 🔵 AFTER router.push("/auth/intent")');
    } catch (err: any) {
      console.error('[AUTH-PAGE] 🔴 Exception in handleSignUp:', err);
      setError(err.message || "Sign up failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/browse"
          className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to browsing</span>
        </Link>

        <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-light tracking-tight">
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'signin' 
                ? 'Welcome back to Carly' 
                : 'Create your Carly account'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                placeholder="••••••••"
                required
              />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <CitySearch
                    value={selectedCity}
                    onChange={setSelectedCity}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center text-sm">
            {mode === 'signin' ? (
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="text-accent hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className="text-accent hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
