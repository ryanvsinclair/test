"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { validatePasswordStrength, signup, signin } from "@/lib/auth/auth-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { CitySearch } from "@/components/ui/city-search";
import { City } from "@/lib/api/cities";

interface AuthFormProps {
  role: "buyer" | "dealer";
  onBack: () => void;
}

export default function AuthForm({ role, onBack }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    
    if (mode === 'signup' && newPassword.length > 0) {
      const validation = validatePasswordStrength(newPassword);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }

    // Check confirm password match if already entered
    if (confirmPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (newConfirmPassword: string) => {
    setConfirmPassword(newConfirmPassword);
    
    if (newConfirmPassword && password !== newConfirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError(null);
    }
  };

  const isFormValid = () => {
    if (mode === 'signin') {
      return email && password;
    } else {
      // Signup validation
      return (
        email &&
        password &&
        confirmPassword &&
        password === confirmPassword &&
        passwordErrors.length === 0 &&
        fullName.trim() &&
        selectedCity
      );
    }
  };

  const handleSubmit = async () => {
  console.log('[AUTH-FLOW] 🔵 Button clicked', { mode, email });
  setError(null);

  if (mode === 'signup') {
    // validation (unchanged)
  }

  setLoading(true);
  console.log('[AUTH-FLOW] 🔵 Loading set to true');

  try {
    console.log('[AUTH-FLOW] 🔵 Starting auth process', { mode, role });

    if (mode === 'signup') {
      console.log('[AUTH-FLOW] 🔵 Calling signup()...');
      const result = await signup({
        email,
        password,
        role,
        fullName: fullName.trim(),
        city: selectedCity
          ? `${selectedCity.name}, ${selectedCity.state}, ${selectedCity.country}`
          : '',
      });

      console.log('[AUTH-FLOW] 🟢 Signup completed', { success: !result.error, error: result.error });

      if (result.error) {
        console.log('[AUTH-FLOW] 🔴 Signup failed, showing error');
        setError(result.error);
        return;
      }

      console.log('[AUTH-FLOW] 🔵 Auto-login after signup...');
      const loginResult = await signin({ email, password });
      console.log('[AUTH-FLOW] 🟢 Auto-login completed', { success: !loginResult.error, userId: loginResult.user?.id });

      if (loginResult.error) {
        console.log('[AUTH-FLOW] 🔴 Auto-login failed');
        setError('Account created. Please sign in.');
        setMode('signin');
        return;
      }

      console.log('[AUTH-FLOW] 🔵 BEFORE router.replace("/welcome")');
      router.replace("/welcome");
      console.log('[AUTH-FLOW] 🔵 AFTER router.replace("/welcome")');
    } else {
      console.log('[AUTH-FLOW] 🔵 Calling signin()...');
      const result = await signin({ email, password });
      console.log('[AUTH-FLOW] 🟢 Signin completed', { success: !result.error, userId: result.user?.id, error: result.error });

      if (result.error) {
        console.log('[AUTH-FLOW] 🔴 Signin failed, showing error');
        setError(result.error);
        return;
      }

      console.log('[AUTH-FLOW] 🔵 BEFORE router.replace("/welcome")');
      router.replace("/welcome");
      console.log('[AUTH-FLOW] 🔵 AFTER router.replace("/welcome")');
    }
  } catch (err) {
    console.error('[AUTH-FLOW] 🔴 EXCEPTION in handleSubmit:', err);
    setError(err instanceof Error ? err.message : 'Authentication failed');
  } finally {
    console.log('[AUTH-FLOW] 🔵 Finally block - setting loading to false');
    setLoading(false);
  }
};

  const isDealerTheme = role === "dealer";
  const bgClass = isDealerTheme ? "bg-[#0a0a0a]" : "bg-background";
  const cardBgClass = isDealerTheme ? "bg-white/5" : "bg-card";
  const borderClass = isDealerTheme ? "border-white/10" : "border-border";
  const textClass = isDealerTheme ? "text-white" : "";
  const mutedTextClass = isDealerTheme ? "text-white/60" : "text-muted-foreground";
  const inputClass = isDealerTheme 
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
    : "";

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center px-6 py-20`}>
      <div className="w-full max-w-md my-auto space-y-6">
        {/* Return to Explore Link */}
        <div className="flex justify-start">
          <Link 
            href="/browse" 
            className={`flex items-center gap-2 text-sm ${mutedTextClass} hover:opacity-70 transition-opacity`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to browsing
          </Link>
        </div>

        <div className={`${cardBgClass} rounded-2xl border ${borderClass} shadow-lg p-6 space-y-5`}>
          {/* Back Button */}
          <button
            onClick={onBack}
            className={`flex items-center gap-2 text-sm ${mutedTextClass} hover:opacity-80 transition-opacity`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className={`text-2xl font-light tracking-tight ${textClass}`}>
              {mode === 'signin' 
                ? (role === "buyer" ? "Sign in to continue" : "Dealer Portal")
                : (role === "buyer" ? "Create your account" : "Create dealer account")
              }
            </h1>
            <p className={`text-xs ${mutedTextClass}`}>
              {role === "buyer" 
                ? "Find your perfect vehicle" 
                : "Manage your inventory and clients"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Email & Password Form */}
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <Input 
                type="email" 
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-11 rounded-xl ${inputClass}`}
                disabled={loading}
              />
            </div>

            {/* Signup: Full Name */}
            {mode === 'signup' && (
              <div className="w-full">
                <Input 
                  type="text" 
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`h-11 rounded-xl ${inputClass}`}
                  disabled={loading}
                />
              </div>
            )}

            {/* Signup: City */}
            {mode === 'signup' && (
              <div className="w-full">
                <CitySearch
                  value={selectedCity}
                  onChange={setSelectedCity}
                  className="h-11 rounded-xl"
                  placeholder="Select your city"
                />
              </div>
            )}

            <div className="w-full">
              <Input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`h-11 rounded-xl ${inputClass}`}
                disabled={loading}
              />
              {mode === 'signup' && passwordErrors.length > 0 && (
                <div className="space-y-1 pt-2">
                  {passwordErrors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signup: Confirm Password */}
            {mode === 'signup' && (
              <div className="w-full">
                <Input 
                  type="password" 
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={`h-11 rounded-xl ${inputClass}`}
                  disabled={loading}
                />
                {confirmPasswordError && (
                  <div className="flex items-start gap-2 text-xs text-red-500 pt-2">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
              className={`w-full rounded-xl h-11 ${
                isDealerTheme 
                  ? "bg-white text-black hover:bg-white/90"
                  : ""
              }`}
              style={!isDealerTheme ? { 
                background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))', 
                color: 'hsl(var(--foreground))' 
              } : undefined}
            >
              {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>

            {/* Toggle signin/signup */}
            <div className="text-center">
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setPasswordErrors([]);
                  setConfirmPasswordError(null);
                  setError(null);
                  setFullName('');
                  setSelectedCity(null);
                  setConfirmPassword('');
                }}
                className={`text-xs ${mutedTextClass} hover:opacity-80`}
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${borderClass}`}></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className={`${cardBgClass} px-2 ${mutedTextClass}`}>or continue with</span>
            </div>
          </div>

          {/* Social Sign-In Options */}
          {/* OAuth providers enabled post-launch */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className={`w-full rounded-xl h-10 justify-start gap-3 text-sm opacity-50 cursor-not-allowed ${
                isDealerTheme 
                  ? "bg-white/5 border-white/10 text-white"
                  : ""
              }`}
              disabled
              style={{ pointerEvents: 'none' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="flex-1 text-left">Continue with Google</span>
              <span className={`text-[10px] ${mutedTextClass}`}>Coming soon</span>
            </Button>
            <Button 
              variant="outline" 
              className={`w-full rounded-xl h-10 justify-start gap-3 text-sm opacity-50 cursor-not-allowed ${
                isDealerTheme 
                  ? "bg-white/5 border-white/10 text-white"
                  : ""
              }`}
              disabled
              style={{ pointerEvents: 'none' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="flex-1 text-left">Continue with Apple</span>
              <span className={`text-[10px] ${mutedTextClass}`}>Coming soon</span>
            </Button>
            <Button 
              variant="outline" 
              className={`w-full rounded-xl h-10 justify-start gap-3 text-sm opacity-50 cursor-not-allowed ${
                isDealerTheme 
                  ? "bg-white/5 border-white/10 text-white"
                  : ""
              }`}
              disabled
              style={{ pointerEvents: 'none' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="flex-1 text-left">Continue with Facebook</span>
              <span className={`text-[10px] ${mutedTextClass}`}>Coming soon</span>
            </Button>
          </div>

          {/* Create Account CTA */}
          <div className="pt-2 text-center">
            <p className={`text-xs ${mutedTextClass}`}>
              Don't have an account?{" "}
              <button 
                className={`font-medium ${isDealerTheme ? "text-white hover:text-white/80" : ""}`}
                style={!isDealerTheme ? { color: 'hsl(var(--accent-primary))' } : undefined}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
