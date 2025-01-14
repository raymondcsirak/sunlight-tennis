import { MetadataRoute } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Court {
  id: string
}

type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'always' | 'hourly' | 'never'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
  
  // Fetch all public courts
  const { data: courts } = await supabase
    .from('courts')
    .select('id')
    .eq('is_active', true)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sunlighttennis.ro'

  // Static routes
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

  // Dynamic routes for courts
  const courtRoutes = courts?.map((court: Court) => ({
    url: `${baseUrl}/courts/${court.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as ChangeFrequency,
    priority: 0.6,
  })) ?? []

  return [...routes, ...courtRoutes]
} 