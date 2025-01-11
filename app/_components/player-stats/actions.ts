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

  // Get all matches where the user was a player
  const { data: matches } = await supabase
    .from("matches")
    .select("winner_id, player1_id, player2_id")
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)

  const totalMatches = matches?.length || 0
  const wonMatches = matches?.filter(match => match.winner_id === userId).length || 0
  const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0

  // Get player XP
  const { data: playerXp } = await supabase
    .from("player_xp")
    .select("current_xp, current_level")
    .eq("user_id", userId)
    .single()

  return {
    totalMatches,
    wonMatches,
    winRate,
    level: playerXp?.current_level || 1,
  }
} 