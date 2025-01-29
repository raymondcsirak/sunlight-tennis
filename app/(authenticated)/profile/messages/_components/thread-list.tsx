"use client"

import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

interface Message {
  id: string
  content: string
  created_at: string
  is_system_message: boolean
  metadata: any
}

interface Thread {
  id: string
  participant1: Profile
  participant2: Profile
  last_message_at: string
  last_message_preview: string
  messages: Message[]
  match_ids: string[]
}

interface ThreadListProps {
  threads: Thread[]
  currentUserId: string
  currentThreadId?: string
}

export function ThreadList({ threads, currentUserId, currentThreadId }: ThreadListProps) {
  const router = useRouter()

  const getOtherParticipant = (thread: Thread) => {
    return thread.participant1.id === currentUserId 
      ? thread.participant2 
      : thread.participant1
  }

  const handleThreadClick = (e: React.MouseEvent, threadId: string) => {
    e.preventDefault()
    router.replace(`/profile/messages?thread=${threadId}`, { scroll: false })
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col p-2 gap-1">
        {threads.map((thread) => {
          const otherParticipant = getOtherParticipant(thread)
          const lastMessage = thread.messages[0]
          const isSelected = thread.id === currentThreadId

          return (
            <button
              key={thread.id}
              onClick={(e) => handleThreadClick(e, thread.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left",
                isSelected && "bg-muted"
              )}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage 
                  src={otherParticipant.avatar_url || undefined} 
                  className="object-cover"
                  alt={otherParticipant.full_name}
                />
                <AvatarFallback>
                  {otherParticipant.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">
                    {otherParticipant.full_name}
                  </span>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(lastMessage.created_at), 'MMM d')}
                    </span>
                  )}
                </div>
                
                {lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {lastMessage.is_system_message ? (
                      <span className="italic">System notification</span>
                    ) : (
                      thread.last_message_preview
                    )}
                  </p>
                )}

                {thread.match_ids?.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {thread.match_ids.length} {thread.match_ids.length === 1 ? 'match' : 'matches'}
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
} 