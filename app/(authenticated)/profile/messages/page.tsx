import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ThreadList } from "./_components/thread-list"
import { MessageView } from "./_components/message-view"
import { ProfileLayout } from "../_components/profile-layout"
import { getPlayerStats } from "@/app/_components/player-stats/actions"

interface PageProps {
  searchParams: Promise<{ thread?: string }>
}

export default async function MessagesPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient()

  // Check auth
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect("/sign-in")
  }

  // Get user profile and stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: playerXp } = await supabase
    .from('player_xp')
    .select('current_xp')
    .eq('user_id', session.user.id)
    .single()

  const playerStats = await getPlayerStats(session.user.id)

  // Get thread ID from search params
  const params = await searchParams
  const currentThreadId = params.thread

  // Get user's threads with latest message and participant info
  const { data: threads } = await supabase
    .from('message_threads')
    .select(`
      *,
      participant1:participant1_id(id, full_name, avatar_url),
      participant2:participant2_id(id, full_name, avatar_url),
      messages!inner(
        id,
        content,
        created_at,
        is_system_message,
        metadata
      )
    `)
    .order('last_message_at', { ascending: false })
    .limit(1, { foreignTable: 'messages' })

  // Get current thread's messages if thread ID is provided
  const { data: currentThread } = currentThreadId ? await supabase
    .from('message_threads')
    .select(`
      *,
      participant1:participant1_id(id, full_name, avatar_url),
      participant2:participant2_id(id, full_name, avatar_url),
      messages(
        id,
        content,
        sender_id,
        created_at,
        read_at,
        is_system_message,
        metadata
      )
    `)
    .eq('id', currentThreadId)
    .single() : { data: null }

  return (
    <ProfileLayout
      user={session.user}
      profile={profile}
      playerXp={playerXp ? { current_xp: playerXp.current_xp } : undefined}
      playerStats={playerStats}
    >
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Thread List Sidebar */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
          <ThreadList 
            threads={threads || []} 
            currentUserId={session.user.id}
            currentThreadId={currentThreadId}
          />
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col">
          {currentThread ? (
            <MessageView 
              thread={currentThread}
              currentUserId={session.user.id}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  )
} 