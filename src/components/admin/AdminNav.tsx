"use client";

import { useAuth } from "@/contexts/AuthContext";
import { CarlyLogo } from "@/components/branding/CarlyLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

export function AdminNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/meet-carly");
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-1">
            <CarlyLogo size="sm" />
            <span className="text-2xl modern-bold">ADMIN</span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Profile */}
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
