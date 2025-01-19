"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Functie pentru actualizarea streak-ului zilnic
// Verifica si actualizeaza streak-ul utilizatorului, creand notificari daca streak-ul este intrerupt
export async function updateStreak() {
  // Initializare cookie store pentru autentificare
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Obtine toate cookie-urile necesare pentru autentificare
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        // Seteaza cookie-urile (folosit pentru refresh tokens)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Eroarea poate fi ignorata daca exista middleware pentru refresh
          }
        },
      },
    }
  )

  try {
    // Obtine utilizatorul curent din sesiune
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('Auth error:', userError)
      throw userError
    }
    if (!user) {
      throw new Error("No user found")
    }

    console.log('Updating streak for user:', user.id)

    // Apeleaza functia RPC pentru actualizarea streak-ului
    const { data: streakData, error: streakError } = await supabase
      .rpc('update_daily_streak', {
        user_id: user.id
      })

    if (streakError) {
      console.error('Streak update error:', streakError)
      throw streakError
    }

    if (!streakData || streakData.length === 0) {
      console.error('No streak data returned')
      throw new Error('No streak data returned')
    }

    console.log('Streak update result:', streakData[0])

    // Daca streak-ul a fost intrerupt, creeaza o notificare pentru utilizator
    if (streakData[0].streak_broken) {
      console.log('Creating streak broken notification')
      const { error: streakNotifError } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'streak_broken',
        p_title: 'Streak Reset',
        p_message: 'Your daily streak has been reset. Log in daily to maintain your streak!',
        p_data: JSON.stringify({})
      })

      if (streakNotifError) {
        console.error('Streak broken notification error:', streakNotifError)
      }
    }

    // Returneaza rezultatul actualizarii streak-ului
    return {
      success: true,
      data: streakData[0]
    }
  } catch (error) {
    // Gestioneaza si logheaza erorile
    console.error('Error updating streak:', error)
    throw error
  }
} 