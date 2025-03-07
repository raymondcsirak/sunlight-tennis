import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { ProfileLayout } from "./_components/profile-layout"
import { XPProgress } from "./_components/xp-progress"
import { TrophyRoom } from "./_components/trophy-room"
import { calculateLevelProgress } from '@/utils/xp'
import { getPlayerStats } from "@/app/_components/player-stats/actions"
import { PlayerStatsCard } from "@/app/_components/player-stats/player-stats-card"
import { AchievementsTab } from "./_components/tabs/achievements-tab"

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

  const [
    { data: profile },
    { data: playerXp },
    { data: achievements },
    stats
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .single(),
    supabase
      .from("player_xp")
      .select()
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("achievements")
      .select()
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    getPlayerStats(user.id)
  ])

  // Calculate level progress using both XP and level from database
  const progress = calculateLevelProgress(
    playerXp?.current_xp || 0,
    playerXp?.current_level || 1
  )

  return (
    <ProfileLayout 
      user={user} 
      profile={profile} 
      playerXp={playerXp}
      playerStats={stats}
    >
      <div className="space-y-4 lg:space-y-6">
        <XPProgress
          level={progress.currentLevel}
          currentXp={progress.levelProgress}
          xpForNextLevel={progress.xpNeededForNextLevel}
          streak={playerXp?.current_streak_days || 0}
        />

        <PlayerStatsCard stats={stats} variant="full" />

        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          <AchievementsTab userId={user.id} />

          <TrophyRoom
            achievements={achievements?.map(a => ({
              id: a.id,
              type: a.type,
              title: a.name,
              earnedAt: a.created_at,
            })) || []}
          />
        </div>
      </div>
    </ProfileLayout>
  )
} 