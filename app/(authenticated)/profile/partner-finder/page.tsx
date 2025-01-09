import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { PartnerFinderTabs } from './_components'

export default async function PartnerFinderPage() {
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

  return (
    <ProfileLayout user={user!} profile={profile} playerXp={playerXp}>
      <PartnerFinderTabs userId={user!.id} />
    </ProfileLayout>
  )
} 