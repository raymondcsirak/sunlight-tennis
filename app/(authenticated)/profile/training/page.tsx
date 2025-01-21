// Pagina principala pentru gestionarea antrenamentelor
// Permite programarea si gestionarea sesiunilor de antrenament cu antrenori
// Integreaza sistemul de rezervari si verificare a disponibilitatii

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { TrainingTab } from '../_components/tabs/training-tab'
import { getPlayerStats } from "@/app/_components/player-stats/actions"

// Componenta principala pentru pagina de antrenamente
// Gestioneaza:
// - Autentificarea utilizatorului
// - Incarcarea profilului si a datelor despre experienta
// - Afisarea interfetei pentru programarea antrenamentelor
export default async function TrainingPage() {
  const cookieStore = cookies()
  const supabase = await createClient()

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

  return (
    <ProfileLayout 
      user={user!} 
      profile={profile} 
      playerXp={playerXp}
      playerStats={stats}
    >
      <TrainingTab />
    </ProfileLayout>
  )
} 