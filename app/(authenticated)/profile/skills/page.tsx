// Pagina principala pentru gestionarea abilitatilor de tenis
// Permite vizualizarea si evaluarea nivelului de joc
// Integreaza sistemul de progres si dezvoltare a jucatorului

import { createServerClient } from "@supabase/ssr"
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { SkillsTab } from '../_components/tabs/skills-tab'
import { getPlayerStats } from "@/app/_components/player-stats/actions"

// Componenta principala pentru pagina de abilitati
// Gestioneaza:
// - Autentificarea si datele utilizatorului
// - Incarcarea profilului si statisticilor
// - Afisarea interfetei de evaluare a abilitatilor
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