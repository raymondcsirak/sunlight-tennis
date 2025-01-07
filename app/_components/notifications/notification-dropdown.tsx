"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createBrowserClient } from "@supabase/ssr"
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type RealtimePostgresChangesPayloadBase = {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: { [key: string]: any }
  old?: { [key: string]: any }
  errors: null | any[]
}

interface RealtimePostgresInsertPayload extends RealtimePostgresChangesPayloadBase {
  eventType: 'INSERT'
  new: Notification
}

interface RealtimePostgresUpdatePayload extends RealtimePostgresChangesPayloadBase {
  eventType: 'UPDATE'
  old: Notification
  new: Notification
}

type NotificationType = 
  | "match_scheduled"
  | "training_reminder"
  | "xp_gained"
  | "level_up"
  | "achievement_unlocked"
  | "court_booked"
  | "training_booked"
  | "partner_request"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  created_at: string
  data?: Record<string, unknown>
}

export function NotificationDropdown() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const { data: notifications = [], error: fetchError } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      
      if (!userId) {
        return []
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)
      
      if (error) {
        console.error("Error fetching notifications:", error)
        throw error
      }
      
      return (data || []) as Notification[]
    },
  })

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter((n: Notification) => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  // Subscribe to new notifications
  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 2000 // 2 seconds
    let cleanupFunction: (() => void) | undefined

    const setupChannel = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) {
          throw new Error("Authentication required")
        }

        const userId = session.user.id

        if (!userId || !mounted) {
          return () => {}
        }

        // Use a stable channel name based on user ID
        const channelId = `notifications-${userId}`

        // Remove any existing channel with the same name
        const existingChannel = supabase.getChannels().find(
          channel => channel.topic === channelId
        )
        if (existingChannel) {
          await supabase.removeChannel(existingChannel)
        }

        const channel = supabase
          .channel(channelId)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`
            },
            (payload: RealtimePostgresChangesPayloadBase) => {
              if (!mounted) return
              if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                queryClient.invalidateQueries({ queryKey: ["notifications"] })
              }
            }
          )

        // Handle connection states
        channel.subscribe((status, err) => {
          if (!mounted) return

          if (status === "SUBSCRIBED") {
            retryCount = 0
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            if (retryCount < maxRetries) {
              setTimeout(() => {
                if (mounted) {
                  retryCount++
                  setupChannel()
                }
              }, retryDelay)
            } else if (err) {
              console.error(`Channel error: ${err.message}`)
            }
          }
        })

        return () => {
          if (mounted) {
            supabase.removeChannel(channel).catch((err: Error) => {
              console.error(`Error removing channel:`, err)
            })
          }
        }
      } catch (error) {
        console.error("Error setting up realtime subscription:", error)
        if (retryCount < maxRetries && mounted) {
          setTimeout(() => {
            retryCount++
            setupChannel()
          }, retryDelay)
        }
        return () => {}
      }
    }

    setupChannel().then(cleanup => {
      if (mounted) {
        cleanupFunction = cleanup
      }
    })

    // Listen for auth state changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        setupChannel()
      }
    })

    return () => {
      mounted = false
      if (cleanupFunction) {
        cleanupFunction()
      }
      authSubscription?.unsubscribe()
    }
  }, [supabase, queryClient])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="text-xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {notifications.map((notification: Notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border-b last:border-b-0"
              >
                <DropdownMenuItem
                  className="flex flex-col items-start p-4 focus:bg-muted/50 space-y-1"
                  onClick={() => !notification.read && markAsRead.mutate(notification.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead.mutate(notification.id)
                        }}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), "h 'hours ago'")}
                  </span>
                </DropdownMenuItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 