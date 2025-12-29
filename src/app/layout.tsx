import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnitsProvider } from "@/contexts/UnitsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import StateRouter from "@/components/layouts/StateRouter";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "Carly - Premium Automotive Marketplace",
  description: "A dual-sided automotive marketplace connecting buyers with trusted sellers and dealers",
};

/**
 * Root Layout - Global Theme Shell
 * 
 * All pages inherit Carly's global gradient theme from this layout.
 * Do not add page-level backgrounds unless intentionally overriding for special cases (modals, dialogs).
 * 
 * The blue → purple gradient is a core brand element and must be visible across all routes.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans carly-gradient-bg`}>
        <ThemeProvider>
          <AuthProvider>
            <UnitsProvider>
              <StateRouter>
                {children}
              </StateRouter>
            </UnitsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
