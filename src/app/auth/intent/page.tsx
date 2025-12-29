"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function IntentSelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to browsing</span>
        </button>

        <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-light tracking-tight">Welcome to Carly</h1>
            <p className="text-muted-foreground">
              How would you like to continue?
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/')}
              className="w-full h-16 rounded-xl text-left justify-start"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                color: 'hsl(var(--foreground))'
              }}
            >
              <div>
                <div className="font-semibold">I'm looking for a vehicle</div>
                <div className="text-xs opacity-90">Browse listings and connect with dealers</div>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/auth/dealer/apply')}
              variant="outline"
              className="w-full h-16 rounded-xl text-left justify-start"
            >
              <div>
                <div className="font-semibold">I'm a dealer</div>
                <div className="text-xs text-muted-foreground">Apply for dealer access or access your dashboard</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
