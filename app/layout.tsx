// Importuri pentru componentele necesare si utilitare
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

// Configurarea fontului Geist pentru intreaga aplicatie
const geist = Geist({
  subsets: ["latin"],
  display: 'swap',
});

// Configurarea metadatelor pentru SEO si social media sharing
export const metadata: Metadata = {
  title: {
    default: 'SunlightTennis.ro - Tennis Club Management Platform',
    template: '%s | SunlightTennis.ro'
  },
  description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
  keywords: ['tennis', 'court booking', 'tennis club', 'tennis community', 'tennis lessons', 'tennis partner'],
  authors: [{ name: 'SunlightTennis' }],
  creator: 'SunlightTennis',
  // Configurare pentru Open Graph (sharing pe retelele sociale)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sunlighttennis.ro',
    title: 'SunlightTennis.ro - Tennis Club Management Platform',
    description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
    siteName: 'SunlightTennis.ro'
  },
  // Configurare pentru Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'SunlightTennis.ro - Tennis Club Management Platform',
    description: 'Book tennis courts, find partners, track your progress, and join a vibrant tennis community.',
    creator: '@sunlighttennis'
  },
  // Configurare pentru robotii de indexare
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

// Componenta principala de layout care se aplica tuturor paginilor
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initializarea clientului Supabase pentru autentificare
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Configurare pentru gestionarea cookie-urilor
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
            // Eroarea poate fi ignorata daca exista middleware pentru refresh-ul sesiunii
          }
        },
      },
    }
  )

  // Obtinerea informatiilor despre utilizatorul curent
  const { data: { user } } = await supabase.auth.getUser()
  
  // Actualizarea streak-ului pentru utilizatorii autentificati
  if (user) {
    await updateStreak()
  }

  // Structura HTML principala a aplicatiei
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Header-ul aplicatiei cu navigare si autentificare */}
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

            {/* Continutul principal al paginii */}
            <main className="flex-1">
              {children}
            </main>

            {/* Footer-ul aplicatiei cu linkuri rapide si informatii de contact */}
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
                {/* Copyright si drepturi de autor */}
                <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
                  <p>© {new Date().getFullYear()} SunlightTennis. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
