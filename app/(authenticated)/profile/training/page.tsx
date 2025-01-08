import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { TrainingTab } from '../_components/tabs/training-tab'

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

  return (
    <ProfileLayout user={user!} profile={profile}>
      <TrainingTab />
    </ProfileLayout>
  )
} 