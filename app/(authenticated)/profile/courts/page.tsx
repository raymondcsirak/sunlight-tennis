import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { ProfileLayout } from '../_components/profile-layout'
import { CourtsTab } from '../_components/tabs/courts-tab'

export default async function CourtsPage() {
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
      <CourtsTab />
    </ProfileLayout>
  )
} 