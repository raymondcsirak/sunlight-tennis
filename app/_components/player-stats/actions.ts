'use server'

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from '@/utils/supabase/server'

export async function getPlayerStats(userId: string) {
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
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

interface LeaderboardPlayer {
  user_id: string
  current_level: number
  total_matches: number
  won_matches: number
  win_rate: number
  profiles: {
    full_name: string
    avatar_url: string | null
  }
}

export async function getLeaderboard(): Promise<LeaderboardPlayer[]> {
  const supabase = await createClient()

  // Get the leaderboard data with a manual join
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      user_id,
      current_level,
      total_matches,
      won_matches,
      win_rate
    `)
    .order('win_rate', { ascending: false })
    .order('total_matches', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Get profiles for these users
  const userIds = data.map(player => player.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return []
  }

  // Combine the data
  const leaderboardData = data.map(player => {
    const profile = profiles?.find(p => p.id === player.user_id)
    if (!profile) return null

    return {
      ...player,
      profiles: {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url
      }
    }
  }).filter((player): player is LeaderboardPlayer => player !== null)

  console.log('Leaderboard data:', leaderboardData)
  return leaderboardData
} 