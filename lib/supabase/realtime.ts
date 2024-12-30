import { RealtimeChannel, RealtimeChannelOptions, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Types for presence data
export interface PresenceState {
  user_id: string
  status: 'online' | 'playing' | 'away'
  last_seen: string
}

// Types for channel events
export type ChannelEvent = {
  type: string
  payload: any
}

// Create a class to manage real-time connections
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private supabase = createClient()

  // Initialize a new channel with error handling and reconnection logic
  public initChannel(channelName: string, options?: RealtimeChannelOptions): RealtimeChannel {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.supabase.channel(channelName, options)
      .on('system', { event: '*' }, (status) => {
        console.log(`System status for ${channelName}:`, status)
      })
      .on('error', (error) => {
        console.error(`Channel ${channelName} error:`, error)
        this.handleChannelError(channelName)
      })

    this.channels.set(channelName, channel)
    return channel
  }

  // Handle channel errors with exponential backoff retry
  private async handleChannelError(channelName: string) {
    const maxRetries = 5
    let retryCount = 0
    const baseDelay = 1000 // 1 second

    while (retryCount < maxRetries) {
      try {
        const delay = baseDelay * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        const channel = this.channels.get(channelName)
        if (channel) {
          await channel.unsubscribe()
          const newChannel = this.initChannel(channelName)
          await newChannel.subscribe()
          break
        }
      } catch (error) {
        console.error(`Retry ${retryCount + 1} failed for ${channelName}:`, error)
        retryCount++
      }
    }
  }

  // Subscribe to presence updates for a channel
  public subscribeToPresence(channelName: string, callback: (presence: PresenceState[]) => void) {
    const channel = this.initChannel(channelName)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        callback(Object.values(state))
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Join:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Leave:', leftPresences)
      })

    return channel
  }

  // Clean up function to unsubscribe from all channels
  public async cleanup() {
    for (const [name, channel] of this.channels.entries()) {
      await channel.unsubscribe()
      this.channels.delete(name)
    }
  }
}

// Create a singleton instance
export const realtimeManager = new RealtimeManager() 