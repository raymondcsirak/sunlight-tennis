// Pagina principala pentru setarile utilizatorului
// Permite configurarea profilului si preferintelor personale
// Integreaza autentificarea si datele utilizatorului

import { createServerClient } from "@supabase/ssr"
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { SettingsTab } from '../_components/tabs/settings-tab'
import { getPlayerStats } from "@/app/_components/player-stats/actions"

// Componenta principala pentru pagina de setari
// Gestioneaza:
// - Obtinerea datelor utilizatorului
// - Incarcarea profilului si statisticilor
// - Afisarea interfetei de setari
export default async function SettingsPage() {
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

  // Obtinem datele utilizatorului autentificat
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Incarcam profilul utilizatorului cu toate detaliile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Obtinem datele despre experienta si nivelul jucatorului
  const { data: playerXp } = await supabase
    .from('player_xp')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // Obtinem statisticile complete ale jucatorului
  const stats = await getPlayerStats(user!.id)
  console.log("Stats in Settings Page:", stats)

  return (
    <ProfileLayout 
      user={user!} 
      profile={profile} 
      playerXp={playerXp}
      playerStats={stats}
    >
      <SettingsTab userId={user!.id} />
    </ProfileLayout>
  )
} 