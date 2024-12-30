import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
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
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/courts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ] as const

  // Dynamic routes for courts
  const courtRoutes = courts?.map((court) => ({
    url: `${baseUrl}/courts/${court.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  })) ?? []

  return [...routes, ...courtRoutes]
} 