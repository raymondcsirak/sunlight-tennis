import { createServerClient } from "@supabase/ssr"
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { SkillsTab } from '../_components/tabs/skills-tab'
import { getPlayerStats } from "@/app/_components/player-stats/actions"

export default async function SkillsPage() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { data: playerXp } = await supabase
    .from('player_xp')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // Get player stats
  const stats = await getPlayerStats(user!.id)
  console.log("Stats in Skills Page:", stats)

  return (
    <ProfileLayout 
      user={user!} 
      profile={profile} 
      playerXp={playerXp}
      playerStats={stats}
    >
      <SkillsTab userId={user!.id} />
    </ProfileLayout>
  )
} 