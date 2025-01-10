"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { format } from 'date-fns'
import { Clock, MapPin, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CurrentRequestsTabProps {
  userId: string
}

interface MatchRequest {
  id: string
  creator_id: string
  preferred_date: string
  preferred_time: string
  duration: string
  court_preference: string
  status: 'open' | 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  creator: {
    full_name: string
    avatar_url: string | null
    level: number
    matches_won: number
  }
  court?: {
    id: string
    name: string
    surface: string
    is_indoor: boolean
  }
}

export function CurrentRequestsTab({ userId }: CurrentRequestsTabProps) {
  const [requests, setRequests] = useState<MatchRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from('match_requests')
        .select(`
          *,
          creator:profiles(
            full_name,
            avatar_url,
            level,
            matches_won
          ),
          court:courts(
            id,
            name,
            surface,
            is_indoor
          )
        `)
        .neq('creator_id', userId) // Don't show own requests
        .eq('status', 'open') // Only show open requests
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequests(requestsData)
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: "Error",
        description: "Failed to load match requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // First update the request status
      const { error: updateError } = await supabase
        .from('match_requests')
        .update({ status: 'pending' })
        .eq('id', requestId)
        .select()
        .single()

      if (updateError) throw updateError

      toast({
        title: "Request Accepted!",
        description: "You've accepted the match request. The creator will be notified.",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })

      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error('Error accepting request:', error)
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-[90rem] mx-auto">
        {requests.map((request) => (
          <Card 
            key={request.id}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 hover:bg-gradient-to-br from-background to-muted/50 max-w-[280px] mx-auto w-full"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
            </div>
            
            <CardHeader className="text-center p-4 pb-2">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={request.creator.avatar_url || undefined} alt={request.creator.full_name} />
                  <AvatarFallback>{request.creator.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg font-semibold">
                  {request.creator.full_name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    Level {request.creator.level}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    <span>{request.creator.matches_won} wins</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(request.preferred_date), 'MMM d')} at {request.preferred_time}</span>
                  </div>
                  <span className="text-muted-foreground">{request.duration}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {request.court?.name} ({request.court?.surface})
                  </span>
                </div>

                <Button 
                  className="w-full mt-2"
                  onClick={() => handleAcceptRequest(request.id)}
                >
                  Let's Play
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {requests.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No open requests available at the moment.
          </div>
        )}
      </div>
    </div>
  )
} 