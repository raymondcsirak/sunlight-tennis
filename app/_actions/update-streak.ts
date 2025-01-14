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
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Server actions don't need to set cookies
        },
        remove(name: string, options: any) {
          // Server actions don't need to remove cookies
        },
      },
    }
  )

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('Auth error:', userError)
      throw userError
    }
    if (!user) {
      throw new Error("No user found")
    }

    console.log('Updating streak for user:', user.id)

    // Update streak and get results
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

    // If streak was broken, create a notification
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

    return {
      success: true,
      data: streakData[0]
    }
  } catch (error) {
    console.error('Error updating streak:', error)
    // Log the full error object for debugging
    console.error('Full error details:', JSON.stringify(error, null, 2))
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update streak'
    }
  }
} 