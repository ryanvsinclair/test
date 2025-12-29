"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FormData {
  thought: string;
  flowType?: "feature" | "issue";
  email?: string;
}

export default function AskPage() {
  const { user, isUnauthenticated } = useAuth();
  const { toast } = useToast();

  const [submitted, setSubmitted] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    thought: "",
    flowType: undefined,
    email: "",
  });

  const handleThoughtChange = (value: string) => {
    setFormData({ ...formData, thought: value });
    if (value.length > 10 && !showOptions) {
      setShowOptions(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.thought.trim()) {
      toast({
        title: "Nothing to submit",
        description: "Please share what's on your mind.",
        variant: "destructive",
      });
      return;
    }

    if (isUnauthenticated && !formData.email) {
      toast({
        title: "Email needed",
        description: "We'd like to follow up with you.",
        variant: "destructive",
      });
      return;
    }

    const submission = {
      type: formData.flowType || "unspecified",
      userId: user?.id,
      email: formData.email || user?.email,
      thought: formData.thought,
      platform: "web",
      timestamp: new Date().toISOString(),
    };

    console.log("Ask Carly submission:", submission);

    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setShowOptions(false);
    setFormData({
      thought: "",
      flowType: undefined,
      email: "",
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-light tracking-tight mb-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Ask Carly</h1>
          <p className="text-muted-foreground text-sm">
            Share ideas or report issues. We read everything.
          </p>
        </div>

        {!submitted && (
          <div className="space-y-6">
            {/* Main thought input */}
            <div className="space-y-2">
              <Textarea
                value={formData.thought}
                onChange={(e) => handleThoughtChange(e.target.value)}
                placeholder="It would be great if Carly could…&#10;Something doesn't seem to work when I try to…"
                className="min-h-[160px] text-base resize-none"
              />
              <p className="text-xs text-muted-foreground px-1">
                No idea is too small. Rough thoughts are welcome.
              </p>
            </div>

            {/* Progressive disclosure - options appear after typing */}
            {showOptions && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Is this:</p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={formData.flowType === "feature" ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, flowType: "feature" })}
                      className="flex-1"
                    >
                      A feature idea
                    </Button>
                    <Button
                      type="button"
                      variant={formData.flowType === "issue" ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, flowType: "issue" })}
                      className="flex-1"
                    >
                      Something not working
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    Optional — helps us route your message
                  </p>
                </div>

                {isUnauthenticated && (
                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground px-1">
                      We'd like to follow up with you
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={!formData.thought.trim()}
                >
                  Send
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Success state */}
        {submitted && (
          <div className="text-center space-y-6 py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto text-accent opacity-80" />
            <div className="space-y-2">
              <h2 className="text-2xl font-light">Got it. Thanks for sharing.</h2>
              <p className="text-sm text-muted-foreground">
                We read everything and use it to improve Carly.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline">
              Submit another
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
