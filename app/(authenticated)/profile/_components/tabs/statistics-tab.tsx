"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"

// Interfata pentru structura unui meci
interface Match {
  id: string
  opponent_name: string
  score: string
  result: "win" | "loss"
  date: string
}

// Interfata pentru structura unei realizari
interface Achievement {
  id: string
  type: string
  title: string
  description: string
  earned_at: string
}

// Interfata pentru structura statisticilor
interface Statistics {
  total_matches: number
  won_matches: number
  win_rate: number
  current_streak: number
  best_streak: number
  current_level: number
}

// Interfata pentru datele unui meci
interface MatchData {
  id: string
  score: string
  winner_id: string
  created_at: string
  profiles: {
    full_name: string
  }
}

// Interfata pentru datele unei realizari
interface AchievementData {
  id: string
  type: string
  title: string
  description: string
  earned_at: string
}

// Interfata pentru proprietatile componentei StatisticsTab
interface StatisticsTabProps {
  userId: string
}

// Componenta principala pentru tab-ul de statistici
export function StatisticsTab({ userId }: StatisticsTabProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<Statistics>({
    total_matches: 0,
    won_matches: 0,
    win_rate: 0,
    current_streak: 0,
    best_streak: 0,
    current_level: 1,
  })
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Hook pentru incarcarea statisticilor utilizatorului
  useEffect(() => {
    async function fetchStatistics() {
      try {
        // Fetch matches
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select(
            `
            id,
            score,
            winner_id,
            created_at,
            profiles:player2_id!inner (
              full_name
            )
          `
          )
          .eq("player1_id", userId)
          .order("created_at", { ascending: false })
          .limit(5)

        if (matchesError) throw matchesError

        // Fetch achievements
        const { data: achievementsData, error: achievementsError } = await supabase
          .from("achievements")
          .select("*")
          .eq("user_id", userId)
          .order("earned_at", { ascending: false })

        if (achievementsError) throw achievementsError

        // Fetch player stats
        const { data: playerStats, error: statsError } = await supabase
          .from("player_stats")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (statsError) throw statsError

        // Transform and set the data
        const typedMatchesData = (matchesData || []) as unknown as MatchData[]
        const typedAchievementsData = achievementsData as AchievementData[]

        setMatches(
          typedMatchesData.map((match) => ({
            id: match.id,
            opponent_name: match.profiles.full_name,
            score: match.score,
            result: match.winner_id === userId ? "win" : "loss",
            date: new Date(match.created_at).toLocaleDateString(),
          }))
        )

        setAchievements(
          typedAchievementsData.map((achievement) => ({
            id: achievement.id,
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            earned_at: new Date(achievement.earned_at).toLocaleDateString(),
          }))
        )

        // Set stats directly from player_stats table
        setStats({
          total_matches: playerStats.total_matches,
          won_matches: playerStats.won_matches,
          win_rate: playerStats.win_rate,
          current_streak: calculateCurrentStreak(typedMatchesData, userId),
          best_streak: calculateBestStreak(typedMatchesData, userId),
          current_level: playerStats.current_level,
        })
      } catch (error) {
        console.error("Error fetching statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [userId, supabase])

  // Afisare mesaj de incarcare
  if (loading) {
    return <div>Loading statistics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_matches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.win_rate)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.current_streak}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.best_streak}</div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
          <CardDescription>
            Level {stats.current_level}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={100}
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">vs. {match.opponent_name}</p>
                  <p className="text-sm text-muted-foreground">{match.date}</p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      match.result === "win"
                        ? "font-medium text-green-600"
                        : "font-medium text-red-600"
                    }
                  >
                    {match.score}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {match.result === "win" ? "Won" : "Lost"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start space-x-4 border-b pb-4 last:border-0 last:pb-0"
              >
                <Trophy className="h-6 w-6 flex-shrink-0 text-yellow-500" />
                <div>
                  <p className="font-medium">{achievement.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Earned on {achievement.earned_at}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Functie pentru calcularea seriei curente
function calculateCurrentStreak(matches: MatchData[], userId: string): number {
  let streak = 0
  for (const match of matches) {
    if (match.winner_id === userId) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// Functie pentru calcularea celei mai bune serii
function calculateBestStreak(matches: MatchData[], userId: string): number {
  let currentStreak = 0
  let bestStreak = 0
  for (const match of matches) {
    if (match.winner_id === userId) {
      currentStreak++
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  return bestStreak
} 