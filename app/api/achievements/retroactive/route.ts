// Importuri necesare pentru functionalitatea rutei
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AchievementService } from '@/lib/services/achievement.service'

// Ruta POST pentru verificarea retroactiva a realizarilor
// POST /api/achievements/retroactive
export async function POST(req: Request) {
  try {
    // Initializare client Supabase pentru server
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Obtine toate cookie-urile
          getAll() {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          // Seteaza cookie-urile (nu este folosit in componente server)
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // Metoda set a fost apelata dintr-o componenta Server.
              // Poate fi ignorat daca exista middleware pentru refresh-ul sesiunilor.
            }
          },
        },
      }
    )

    // Verifica autentificarea utilizatorului
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initializeaza serviciul de realizari si verifica retroactiv
    const achievementService = new AchievementService()
    await achievementService.retroactivelyCheckAchievements(user.id)

    // Returneaza raspuns de succes
    return NextResponse.json({
      status: 'success',
      message: 'Achievements retroactively checked and awarded'
    })

  } catch (error) {
    // Gestioneaza si logheza erorile
    console.error('Error in retroactive achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 