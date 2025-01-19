// Importuri necesare pentru generarea sitemap-ului si conexiunea cu Supabase
import { MetadataRoute } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Interfata pentru datele despre terenuri
interface Court {
  id: string
}

// Tipul pentru frecventa de actualizare a paginilor in sitemap
type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'always' | 'hourly' | 'never'

// Functia principala pentru generarea sitemap-ului
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Initializam clientul Supabase pentru server
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
          // Aceasta este o componenta server, nu trebuie sa setam cookie-uri
        },
        remove(name: string, options: any) {
          // Aceasta este o componenta server, nu trebuie sa stergem cookie-uri
        },
      },
    }
  )
  
  // Preluam toate terenurile active din baza de date
  const { data: courts } = await supabase
    .from('courts')
    .select('id')
    .eq('is_active', true)

  // URL-ul de baza al aplicatiei
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sunlighttennis.ro'

  // Rutele statice ale aplicatiei cu prioritatile si frecventele lor de actualizare
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 1,
    },
    {
      url: `${baseUrl}/courts`,
      lastModified: new Date(),
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.5,
    },
  ]

  // Generam rutele dinamice pentru fiecare teren
  const courtRoutes = courts?.map((court: Court) => ({
    url: `${baseUrl}/courts/${court.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as ChangeFrequency,
    priority: 0.6,
  })) ?? []

  // Combinam si returnam toate rutele
  return [...routes, ...courtRoutes]
} 