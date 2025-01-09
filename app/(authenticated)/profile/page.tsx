import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { ProfileLayout } from "./_components/profile-layout"
import { XPProgress } from "./_components/xp-progress"
import { StatsCards } from "./_components/stats-cards"
import { TrophyRoom } from "./_components/trophy-room"
import { calculateLevelProgress } from '@/utils/xp'

export default async function ProfilePage() {
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

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select()
    .eq("id", user.id)
    .single()

  const { data: playerXp } = await supabase
    .from("player_xp")
    .select()
    .eq("user_id", user.id)
    .single()

  // Calculate level progress using our utility
  const progress = calculateLevelProgress(playerXp?.current_xp || 0)

  // Get total matches and win rate
  const { data: matches } = await supabase
    .from("matches")
    .select("winner_id, created_at")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

  const totalMatches = matches?.length || 0
  const wonMatches = matches?.filter(match => match.winner_id === user.id).length || 0
  const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0

  // Calculate total hours (placeholder - you'll need to implement actual tracking)
  const totalHours = matches?.length ? matches.length * 2 : 0 // Assuming 2 hours per match

  // Get achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select()
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false })
    .limit(4)

  return (
    <ProfileLayout user={user} profile={profile}>
      <div className="space-y-6">
        <XPProgress
          level={progress.currentLevel}
          currentXp={progress.levelProgress}
          xpForNextLevel={progress.xpNeededForNextLevel}
          streak={playerXp?.current_streak_days || 0}
        />

        <StatsCards
          totalMatches={totalMatches}
          winRate={winRate}
          totalHours={totalHours}
        />

        <TrophyRoom
          achievements={achievements?.map(a => ({
            id: a.id,
            type: a.type,
            title: a.name,
            earnedAt: a.earned_at,
          })) || []}
        />
      </div>
    </ProfileLayout>
  )
} 