import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { ProfileLayout } from "./_components/profile-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformanceTab } from "./_components/tabs/performance-tab"
import { ActivityTab } from "./_components/tabs/activity-tab"

export default async function ProfilePage() {
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

  return (
    <ProfileLayout user={user} profile={profile}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Player Analytics</h1>
        
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="performance" className="space-y-4">
            <PerformanceTab userId={user.id} />
          </TabsContent>
          <TabsContent value="activity" className="space-y-4">
            <ActivityTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </ProfileLayout>
  )
} 