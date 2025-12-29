'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

/**
 * PUBLIC Welcome Page (Auth-Aware, Not Guarded)
 * 
 * Flow: Sign In → /welcome → User clicks Enter → /browse
 * 
 * This page:
 * - Is publicly accessible (no layout guards)
 * - Shows loading state while auth hydrates
 * - Redirects to /auth if user is unauthenticated AFTER loading completes
 * - Does NOT inherit buyer layout or guards
 */
export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [exiting, setExiting] = useState(false);

  console.log('[WELCOME] 🔵 Page render', { isLoading, hasUser: !!user, userId: user?.id });

  // Wait for auth to finish loading before checking authentication
  useEffect(() => {
    console.log('[WELCOME] 🔵 Auth check effect', { isLoading, hasUser: !!user });
    if (!isLoading && !user) {
      console.log('[WELCOME] 🔴 Not authenticated, redirecting to /auth');
      router.replace('/auth');
    } else if (!isLoading && user) {
      console.log('[WELCOME] 🟢 Authenticated, showing welcome screen');
    }
  }, [isLoading, user, router]);

  const handleEnter = () => {
    console.log('[WELCOME] 🔵 Enter button clicked');
    setExiting(true);
    setTimeout(() => {
      console.log('[WELCOME] 🔵 Navigating to /');
      router.replace('/');
    }, 500);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !exiting) {
        handleEnter();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exiting]);

  // Show loading state while auth hydrates
  if (isLoading) {
    console.log('[WELCOME] 🟡 Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render welcome if not authenticated (redirect will trigger)
  if (!user) {
    console.log('[WELCOME] 🔴 No user, returning null (redirect should trigger)');
    return null;
  }

  console.log('[WELCOME] 🟢 Rendering welcome animation');
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="min-h-screen flex items-center justify-center bg-background"
      >
      <div className="text-center space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-9xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          style={{
            filter: 'drop-shadow(0 0 12px rgba(147, 51, 234, 0.3)) drop-shadow(0 0 25px rgba(37, 99, 235, 0.2))'
          }}
        >
          Welcome to Carly
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-5xl text-muted-foreground"
        >
          The Ultimate Car Shopping Experience
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <motion.button
            onClick={handleEnter}
            className="mt-10 px-10 py-6 text-3xl font-normal bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300 cursor-pointer border-0"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            animate={{
              y: [0, -6, 0],
              boxShadow: [
                '0 0 25px rgba(37,99,235,0.6)',
                '0 0 40px rgba(37,99,235,0.85)',
                '0 0 25px rgba(37,99,235,0.6)'
              ]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            whileHover={{
              boxShadow: '0 0 45px rgba(37,99,235,0.85)'
            }}
          >
            ENTER
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
    </>
  );
}
