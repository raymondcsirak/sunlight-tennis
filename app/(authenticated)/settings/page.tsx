import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { ProfileLayout } from "../profile/_components/profile-layout"
import { SettingsTab } from "../profile/_components/tabs/settings-tab"

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

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select()
    .eq("id", user.id)
    .single()

  const { data: settings } = await supabase
    .from("user_settings")
    .select()
    .eq("user_id", user.id)
    .single()

  return (
    <ProfileLayout user={user} profile={profile}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <SettingsTab userId={user.id} initialSettings={settings?.settings} />
      </div>
    </ProfileLayout>
  )
} 