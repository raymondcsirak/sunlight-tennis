// Server actions for managing player statistics
'use server'

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from '@/utils/supabase/server'

// Function to get statistics for a specific player
export async function getPlayerStats(userId: string) {
  // Initialize cookie store for authentication
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Get all cookies needed for authentication
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        // Set cookies (used for refresh tokens)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Error can be ignored if there's middleware for refresh
          }
        },
      },
    }
  )

  // Get player statistics from player_stats table
  const { data: stats } = await supabase
    .from('player_stats')
    .select('current_level, total_matches, won_matches, win_rate')
    .eq('user_id', userId)
    .single()

  // Return formatted statistics with default values if no data exists
  return {
    totalMatches: stats?.total_matches ?? 0,
    wonMatches: stats?.won_matches ?? 0,
    winRate: stats?.win_rate ?? 0,
    level: stats?.current_level ?? 1,
  }
}

// Interface for player data in leaderboard
interface LeaderboardPlayer {
  user_id: string          // User ID
  current_level: number    // Current level
  total_matches: number    // Total matches played
  won_matches: number      // Matches won
  win_rate: number         // Win rate
  profiles: {
    full_name: string      // Player's full name
    avatar_url: string | null  // Avatar URL
  }
}

// Function to get player leaderboard
export async function getLeaderboard(): Promise<LeaderboardPlayer[]> {
  const supabase = await createClient()

  // Get leaderboard data, ordered by win rate and total matches
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

  // Get profiles for leaderboard players
  const userIds = data.map(player => player.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return []
  }

  // Combine statistical data with player profiles
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