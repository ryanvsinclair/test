import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnitsProvider } from "@/contexts/UnitsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ServerShell from "@/components/layouts/ServerShell";
import RouteGuard from "@/components/layouts/RouteGuard";

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
 * Root Layout - Server-Owned Shell
 * 
 * Architecture:
 * - ServerShell (server component) decides which nav/footer to render
 * - AuthProvider wraps children for client-side interactivity (NOT layout decisions)
 * - This ensures nav, footer, and page switch atomically on login/logout
 * 
 * Auth Authority:
 * - Server (ServerShell): Layout decisions (nav/footer variants)
 * - Client (AuthContext): UI interactivity (buttons, save actions, personalization)
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
              <RouteGuard>
                <ServerShell>
                  {children}
                </ServerShell>
              </RouteGuard>
            </UnitsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
