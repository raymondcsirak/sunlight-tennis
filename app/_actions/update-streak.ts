"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function updateStreak() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
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
          }
        },
      },
    }
  )

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('Auth error:', userError)
      throw userError
    }
    if (!user) {
      throw new Error("No user found")
    }

    console.log('Updating streak for user:', user.id)

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

    if (streakData[0].streak_broken) {
      console.log('Creating streak broken notification')
      const { error: streakNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'streak_broken',
          title: 'Streak Reset',
          message: 'Your daily streak has been reset. Log in daily to maintain your streak!',
          data: {}
        })

      if (streakNotifError) {
        console.error('Streak broken notification error:', streakNotifError)
      }
    }

    return {
      success: true,
      data: streakData[0]
    }
  } catch (error) {
    console.error('Error updating streak:', error)
    throw error
  }
} 