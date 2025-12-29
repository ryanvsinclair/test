/**
 * BrowseLoggedOut - Public marketplace view
 * 
 * Shows public listings with limited interactivity.
 * No save/message features. CTA to sign in.
 */

import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BrowseLoggedOut() {
  return (
    <section className="pt-32 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Browse Vehicles
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore thousands of verified listings
          </p>
        </div>

        {/* Sign in CTA banner */}
        <div className="max-w-2xl mx-auto mb-12 p-6 rounded-xl bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" 
              style={{ backgroundColor: 'hsl(var(--accent-glow))' }}
            >
              <Heart className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Sign in to unlock full features</p>
              <p className="text-xs text-muted-foreground">
                Save favorites, message sellers, and get personalized recommendations
              </p>
            </div>
            <Link href="/auth">
              <Button 
                size="default" 
                className="rounded-lg flex-shrink-0" 
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))', 
                  color: 'hsl(var(--foreground))' 
                }}
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* TODO: Public listings grid */}
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-light mb-2">Public Listings Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Browse public vehicle listings without signing in. Full marketplace experience available when logged in.
          </p>
          <Link href="/auth">
            <Button className="mt-6">
              Sign In Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
