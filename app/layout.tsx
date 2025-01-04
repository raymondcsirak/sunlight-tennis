import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import { Metadata } from 'next'
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'SunlightTennis.ro - Tennis Club Management Platform',
    template: '%s | SunlightTennis.ro'
  },
  description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
  keywords: ['tennis', 'court booking', 'tennis club', 'tennis community', 'tennis lessons', 'tennis partner'],
  authors: [{ name: 'SunlightTennis' }],
  creator: 'SunlightTennis',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sunlighttennis.ro',
    title: 'SunlightTennis.ro - Tennis Club Management Platform',
    description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
    siteName: 'SunlightTennis.ro'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SunlightTennis.ro - Tennis Club Management Platform',
    description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
    creator: '@sunlighttennis'
  },
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // This is a server component, so we don't need to set cookies
        },
        remove(name: string, options: any) {
          // This is a server component, so we don't need to remove cookies
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
              <div className="flex justify-between items-center h-full">
                <Link href="/" className="text-xl font-bold">
                  SunlightTennis
                </Link>
                <div className="flex items-center gap-4">
                  <HeaderAuth email={user?.email} />
                  <ThemeSwitcher />
                </div>
              </div>
            </nav>
          </header>

          {children}

          <footer className="bg-muted py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/courts" className="text-muted-foreground hover:text-foreground">
                        Courts
                      </Link>
                    </li>
                    <li>
                      <Link href="/partners" className="text-muted-foreground hover:text-foreground">
                        Find Partners
                      </Link>
                    </li>
                    <li>
                      <Link href="/profile" className="text-muted-foreground hover:text-foreground">
                        Profile
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact</h3>
                  <address className="text-muted-foreground not-italic">
                    123 Tennis Court Street<br />
                    Bucharest, Romania<br />
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
              <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
                <p>© {new Date().getFullYear()} SunlightTennis. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
