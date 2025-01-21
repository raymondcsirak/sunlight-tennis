// Pagina principala pentru sistemul de cautare parteneri de tenis
// Permite jucatorilor sa gaseasca alti jucatori pentru meciuri si antrenamente
// Integreaza sistemul de potrivire bazat pe nivel de experienta si disponibilitate

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProfileLayout } from '../_components/profile-layout'
import { PartnerFinderTabs } from './_components'
import { getPlayerStats } from "@/app/_components/player-stats/actions"

export default async function PartnerFinderPage() {
  const cookieStore = cookies()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/sign-in')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: playerXp } = await supabase
    .from('player_xp')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get player stats
  const stats = await getPlayerStats(user.id)

  return (
    <ProfileLayout 
      user={user} 
      profile={profile} 
      playerXp={playerXp}
      playerStats={stats}
    >
      <PartnerFinderTabs userId={user.id} />
    </ProfileLayout>
  )
} 