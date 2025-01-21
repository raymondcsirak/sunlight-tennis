import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ThreadList } from "./_components/thread-list"
import { MessageView } from "./_components/message-view"
import { ProfileLayout } from "../_components/profile-layout"
import { getPlayerStats } from "@/app/_components/player-stats/actions"

// Pagina principala pentru sistemul de mesagerie
// Implementeaza un sistem de chat in timp real folosind Supabase Realtime
// Permite comunicarea intre jucatori si gestionarea conversatiilor legate de meciuri

interface PageProps {
  searchParams: Promise<{ thread?: string }>
}

export default async function MessagesPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient()

  // Check auth using getUser instead of getSession
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/sign-in")
  }

  // Get user profile and stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: playerXp } = await supabase
    .from('player_xp')
    .select('current_xp')
    .eq('user_id', user.id)
    .single()

  const playerStats = await getPlayerStats(user.id)

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
      messages(
        id,
        content,
        created_at,
        is_system_message,
        metadata
      )
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

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

  // Transform avatar URLs to full URLs
  const transformAvatarUrls = (data: any) => {
    if (!data) return data;
    
    if (data.participant1?.avatar_url) {
      data.participant1.avatar_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${data.participant1.avatar_url}`
    }
    if (data.participant2?.avatar_url) {
      data.participant2.avatar_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${data.participant2.avatar_url}`
    }
    return data;
  }

  // Transform avatar URLs for all threads and current thread
  const transformedThreads = threads?.map(thread => transformAvatarUrls(thread))
  const transformedCurrentThread = transformAvatarUrls(currentThread)

  return (
    <ProfileLayout
      user={user}
      profile={profile}
      playerXp={playerXp ? { current_xp: playerXp.current_xp } : undefined}
      playerStats={playerStats}
      hideFooter={true}
    >
      <div className="h-full flex">
        <div className="w-80 border-r bg-background flex flex-col">
          <div className="p-4 border-b shrink-0">
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ThreadList 
              threads={transformedThreads || []} 
              currentUserId={user.id}
              currentThreadId={currentThreadId}
            />
          </div>
        </div>
        
        <div className="flex-1 bg-background">
          {transformedCurrentThread ? (
            <MessageView 
              thread={transformedCurrentThread}
              currentUserId={user.id}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  )
} 