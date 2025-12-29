'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Theme toggling is intentionally binary (light/dark). 
 * System mode is not supported by design to maintain consistent UX across Buyer and Dealer UIs.
 */
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get persisted theme from localStorage
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setThemeState(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      // Default to dark mode
      setThemeState('dark');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    }
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
