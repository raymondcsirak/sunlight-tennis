"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Componenta pentru vizualizarea si gestionarea unei conversatii
// Afiseaza mesajele dintre doi utilizatori si permite trimiterea de mesaje noi
// Implementeaza functionalitati de real-time pentru actualizari instant

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  read_at: string | null
  is_system_message: boolean
  metadata: any
}

interface Thread {
  id: string
  participant1: Profile
  participant2: Profile
  messages: Message[]
  match_ids: string[]
}

interface MessageViewProps {
  thread: Thread
  currentUserId: string
}

export function MessageView({ thread, currentUserId }: MessageViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Add debug logging
  console.log('Thread data:', {
    threadId: thread.id,
    messageCount: thread.messages?.length || 0,
    messages: thread.messages
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const otherParticipant = 
    thread.participant1.id === currentUserId 
      ? thread.participant2 
      : thread.participant1

  // Reset scroll position when thread changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [thread.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [thread.messages])

  // Mark messages as read
  useEffect(() => {
    const markMessagesAsRead = async () => {
      const unreadMessages = thread.messages
        .filter(m => !m.read_at && m.sender_id !== currentUserId)
        .map(m => m.id)

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages)
      }
    }

    markMessagesAsRead()
  }, [thread.messages, currentUserId, supabase])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`thread-${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${thread.id}`
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [thread.id, router, supabase])

  const handleSendMessage = async () => {
    const content = textareaRef.current?.value.trim()
    if (!content) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: currentUserId,
          content
        })

      if (error) throw error

      // Clear input
      if (textareaRef.current) {
        textareaRef.current.value = ""
      }

      // Refresh the page to show new message
      router.refresh()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteThread = async () => {
    try {
      const { error } = await supabase
        .from('message_threads')
        .delete()
        .eq('id', thread.id)

      if (error) throw error

      toast({
        title: "Thread Deleted",
        description: "The conversation has been deleted.",
      })

      router.push('/profile/messages')
      router.refresh()
    } catch (error) {
      console.error('Error deleting thread:', error)
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
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
          <div>
            <h2 className="font-semibold">{otherParticipant.full_name}</h2>
            {thread.match_ids?.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {thread.match_ids.length} {thread.match_ids.length === 1 ? 'match' : 'matches'} together
              </p>
            )}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              Delete Chat
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this conversation? This action cannot be undone.
                Match history and records will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteThread}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {thread.messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUserId
            const sender = isCurrentUser 
              ? (thread.participant1.id === currentUserId ? thread.participant1 : thread.participant2)
              : (thread.participant1.id === message.sender_id ? thread.participant1 : thread.participant2)

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isCurrentUser && "flex-row-reverse"
                )}
              >
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarImage 
                    src={sender.avatar_url || undefined} 
                    className="object-cover"
                    alt={sender.full_name}
                  />
                  <AvatarFallback>
                    {sender.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className={cn(
                  "flex flex-col gap-1",
                  isCurrentUser && "items-end"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {sender.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'h:mm a')}
                    </span>
                  </div>

                  <div className={cn(
                    "rounded-lg px-3 py-2 max-w-md",
                    isCurrentUser 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted",
                    message.is_system_message && "bg-muted/50 italic text-muted-foreground"
                  )}>
                    {message.content}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="shrink-0 p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="min-h-[2.5rem] max-h-32"
            onKeyDown={handleKeyPress}
          />
          <Button 
            size="icon"
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 