import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { realtimeManager, PresenceState } from '@/lib/supabase/realtime'

interface UseRealtimeOptions {
  channelName: string
  event?: string
  filter?: string
}

export function useRealtime<T = any>({ channelName, event, filter }: UseRealtimeOptions) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel

    const initializeRealtime = async () => {
      try {
        channel = realtimeManager.initChannel(channelName)

        if (event) {
          channel.on('postgres_changes', {
            event,
            schema: 'public',
            ...(filter && { filter })
          }, (payload) => {
            setData(payload.new as T)
          })
        }

        await channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsLoading(false)
          }
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'))
        setIsLoading(false)
      }
    }

    initializeRealtime()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [channelName, event, filter])

  return { data, error, isLoading }
}

// Hook for presence functionality
export function usePresence(channelName: string) {
  const [presenceData, setPresenceData] = useState<PresenceState[]>([])

  useEffect(() => {
    const channel = realtimeManager.subscribeToPresence(channelName, (presence) => {
      setPresenceData(presence)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [channelName])

  return presenceData
} 