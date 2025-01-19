// Actiuni server pentru gestionarea statisticilor jucatorilor
'use server'

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from '@/utils/supabase/server'

// Functie pentru obtinerea statisticilor unui jucator specific
export async function getPlayerStats(userId: string) {
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

  // Obtine statisticile jucatorului din tabela player_stats
  const { data: stats } = await supabase
    .from('player_stats')
    .select('current_level, total_matches, won_matches, win_rate')
    .eq('user_id', userId)
    .single()

  // Returneaza statisticile formatate, cu valori implicite pentru cazul in care nu exista date
  return {
    totalMatches: stats?.total_matches ?? 0,
    wonMatches: stats?.won_matches ?? 0,
    winRate: stats?.win_rate ?? 0,
    level: stats?.current_level ?? 1,
  }
}

// Interfata pentru datele unui jucator din clasament
interface LeaderboardPlayer {
  user_id: string          // ID-ul utilizatorului
  current_level: number    // Nivelul curent
  total_matches: number    // Total meciuri jucate
  won_matches: number      // Meciuri castigate
  win_rate: number         // Rata de castig
  profiles: {
    full_name: string      // Numele complet al jucatorului
    avatar_url: string | null  // URL-ul avatarului
  }
}

// Functie pentru obtinerea clasamentului jucatorilor
export async function getLeaderboard(): Promise<LeaderboardPlayer[]> {
  const supabase = await createClient()

  // Obtine datele pentru clasament, ordonate dupa rata de castig si numarul total de meciuri
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

  // Obtine profilurile pentru jucatorii din clasament
  const userIds = data.map(player => player.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return []
  }

  // Combina datele statistice cu profilurile jucatorilor
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