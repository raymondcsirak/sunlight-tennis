'use server'

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function getPlayerStats(userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Get player stats from the new player_stats table
  const { data: stats } = await supabase
    .from('player_stats')
    .select('current_level, total_matches, won_matches, win_rate')
    .eq('user_id', userId)
    .single()

  return {
    totalMatches: stats?.total_matches ?? 0,
    wonMatches: stats?.won_matches ?? 0,
    winRate: stats?.win_rate ?? 0,
    level: stats?.current_level ?? 1,
  }
} 