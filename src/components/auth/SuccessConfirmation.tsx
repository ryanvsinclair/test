"use client";

import { CheckCircle2 } from "lucide-react";

interface SuccessConfirmationProps {
  role: "buyer" | "dealer";
}

export default function SuccessConfirmation({ role }: SuccessConfirmationProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md my-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent-glow))' }}>
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-light tracking-tight">You're all set</h2>
          <p className="text-sm text-muted-foreground">
            {role === "buyer" 
              ? "Taking you to your personalized dashboard..." 
              : "Taking you to your dealer portal..."}
          </p>
        </div>
      </div>
    </div>
  );
}
