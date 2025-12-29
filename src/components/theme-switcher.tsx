"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

/**
 * Unified theme toggle component.
 * Used across both Buyer and Dealer UIs.
 * Single-click toggle only (light ↔ dark). No dropdown, no system mode.
 */
const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={toggleTheme}
      className="transition-all hover:scale-105"
    >
      {theme === "light" ? (
        <Sun
          key="light"
          size={ICON_SIZE}
          className="text-muted-foreground"
        />
      ) : (
        <Moon
          key="dark"
          size={ICON_SIZE}
          className="text-muted-foreground"
        />
      )}
    </Button>
  );
};

export { ThemeSwitcher };
