// Imports for required components and utilities
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import { Metadata } from 'next'
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Providers } from "./providers"
import { updateStreak } from "./_actions/update-streak"

// Configure Geist font for the entire application
const geist = Geist({
  subsets: ["latin"],
  display: 'swap',
});

// Configure metadata for SEO and social media sharing
export const metadata: Metadata = {
  title: {
    default: 'Sunlight Tennis Club - Tennis Club Management Platform',
    template: '%s | Sunlight Tennis Club'
  },
  description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
  keywords: ['tennis', 'court booking', 'tennis club', 'tennis community', 'tennis lessons', 'tennis partner'],
  authors: [{ name: 'Sunlight Tennis Club' }],
  creator: 'Sunlight Tennis Club',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/favicon.ico',
    },
  },
  // Configuration for Open Graph (social media sharing)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sunlighttennis.ro',
    title: 'Sunlight Tennis Club - Tennis Club Management Platform',
    description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
    siteName: 'Sunlight Tennis Club'
  },
  // Configuration for Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'Sunlight Tennis Club - Tennis Club Management Platform',
    description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
    creator: '@sunlighttennis'
  },
  // Configuration for indexing robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Main layout component that applies to all pages
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize Supabase client for authentication
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Configuration for cookie management
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Error can be ignored if there's middleware for session refresh
          }
        },
      },
    }
  )

  // Get current user information
  const { data: { user } } = await supabase.auth.getUser()
  
  // Update streak for authenticated users
  if (user) {
    await updateStreak()
  }

  // Main HTML structure of the application
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Application header with navigation and authentication */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b">
              <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
                <div className="flex justify-between items-center h-full">
                  <Link href="/" className="text-xl font-bold">
                    Sunlight Tennis Club
                  </Link>
                  <div className="flex items-center gap-4">
                    <HeaderAuth email={user?.email} />
                    <ThemeSwitcher />
                  </div>
                </div>
              </nav>
            </header>

            {/* Main page content */}
            <main className="flex-1">
              {children}
            </main>

            {/* Application footer with quick links and contact information */}
            <footer className="bg-muted py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
                          Terenuri
                        </Link>
                      </li>
                      <li>
                        <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
                          Gaseste Parteneri
                        </Link>
                      </li>
                      <li>
                        <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
                          Profil
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact</h3>
                    <address className="text-muted-foreground not-italic">
                      Strada Mușcatelor 9<br />
                      Satu Mare, Romania<br />
                      <a href="tel:+40123456789" className="hover:text-foreground">
                        +40 123 456 789
                      </a>
                      <br />
                      <a href="mailto:contact@sunlighttennis.ro" className="hover:text-foreground">
                        contact@sunlighttennis.ro
                      </a>
                    </address>
                  </div>
                </div>
                {/* Copyright and attribution */}
                <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
                  <p>© {new Date().getFullYear()} Sunlight Tennis Club. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
