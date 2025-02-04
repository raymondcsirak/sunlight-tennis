import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { CourtsTab } from '../_components/tabs/courts-tab'
import { getPlayerStats } from "@/app/_components/player-stats/actions"

// Pagina principala pentru gestionarea terenurilor de tenis
// Afiseaza lista de terenuri disponibile si permite rezervarea acestora
export default async function CourtsPage() {
  const cookieStore = cookies()
  const supabase = await createClient()

  // Se obtine user-ul curent
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Se obtine experienta jucatorului
  const { data: playerXp } = await supabase
    .from('player_xp')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // Se obtin statisticiile jucatorului
  const stats = await getPlayerStats(user!.id)

  return (
    <ProfileLayout 
      user={user!} 
      profile={profile} 
      playerXp={playerXp}
      playerStats={stats}
    >
      <CourtsTab />
    </ProfileLayout>
  )
} 