"use client"

import { useEffect, useState, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, addHours } from 'date-fns'
import { Clock, Cloud, Sun, Trophy, Check, X, ChevronRight, Thermometer, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MatchResponses } from "./match-responses"
import { fetchWeatherForecast, type WeatherForecast } from '@/lib/utils/weather'

// Helper function to get the full avatar URL
function getAvatarUrl(path: string | null) {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

interface MyMatchesTabProps {
  userId: string
}

type RequestFilter = 'all' | 'open' | 'accepted' | 'rejected'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Requests' },
  { value: 'open', label: 'Open Requests' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
] as const

const AVAILABLE_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

const DURATIONS = [
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' }
]

interface MatchRequest {
  id: string
  creator_id: string
  preferred_date: string
  preferred_time: string
  duration: string
  court_preference: string
  status: 'open' | 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  court?: Court
  matches?: Array<{
    id: string
    winner_id: string | null
    player1_id: string
    player2_id: string
    request_id: string
  }>
  responses?: Array<{
    id: string
    status: 'pending' | 'accepted' | 'rejected'
    responder: {
      id: string
      full_name: string
      avatar_url: string | null
      level: number
      matches_won: number
    }
  }>
}

interface Court {
  id: string
  name: string
  surface: string
  is_indoor: boolean
}

interface WinnerSelectionDialogProps {
  match: {
    id: string
    player1: {
      id: string
      full_name: string
      avatar_url: string | null
    }
    player2: {
      id: string
      full_name: string
      avatar_url: string | null
    }
    match_request: {
      preferred_date: string
      preferred_time: string
      duration: string
    }
    current_selection?: {
      selected_winner_id: string
    }
    other_player_selection?: {
      selected_winner_id: string
    }
  }
  onSelect: (winnerId: string) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

function WinnerSelectionDialog({ match, onSelect, open, onOpenChange }: WinnerSelectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSelect = async (winnerId: string) => {
    try {
      setIsLoading(true)
      await onSelect(winnerId)
      // Only close if there's no other selection or if both agree
      if (!match.other_player_selection || match.other_player_selection.selected_winner_id === winnerId) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error selecting winner:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentSelection = match.current_selection?.selected_winner_id
  const otherPlayerSelection = match.other_player_selection?.selected_winner_id

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl">Select Match Winner</DialogTitle>
        <div className="space-y-2">
          <DialogDescription className="text-base">
            Please select who won this match. The result will only be confirmed when both players agree.
          </DialogDescription>
          {currentSelection && otherPlayerSelection && currentSelection !== otherPlayerSelection && (
            <div className="p-2 bg-destructive/10 text-destructive rounded-md text-sm">
              There is a disagreement about the winner. Please discuss with your opponent and select again.
            </div>
          )}
        </div>
      </DialogHeader>

      {/* Match Details */}
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{format(new Date(match.match_request.preferred_date), 'MMM d')} at {match.match_request.preferred_time}</span>
          </div>
          <div className="text-muted-foreground">•</div>
          <div className="text-muted-foreground">
            {match.match_request.duration}
          </div>
        </div>
      </div>

      {/* Player Selection */}
      <div className="grid grid-cols-2 gap-6">
        {[match.player1, match.player2].map((player) => (
          <Button
            key={player.id}
            variant="outline"
            className={cn(
              "flex flex-col items-center gap-3 p-6 h-auto hover:border-primary hover:bg-accent group relative overflow-hidden",
              currentSelection === player.id && "border-primary bg-accent"
            )}
            onClick={() => handleSelect(player.id)}
            disabled={isLoading}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Avatar className="h-20 w-20 border-2 border-muted-foreground/20">
              <AvatarImage src={getAvatarUrl(player.avatar_url) || undefined} className="object-cover" />
              <AvatarFallback className="text-lg">
                {player.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <div className="font-medium">{player.full_name}</div>
              <Badge variant="secondary" className="group-hover:bg-primary/10">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Selecting...
                  </div>
                ) : currentSelection === player.id ? (
                  'Selected as Winner'
                ) : (
                  'Select as Winner'
                )}
              </Badge>
            </div>
          </Button>
        ))}
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  )
}

interface MatchWithPlayers {
  id: string
  player1: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  player2: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  match_request: {
    preferred_date: string
    preferred_time: string
    duration: string
  }
  current_selection?: {
    selected_winner_id: string
  }
  other_player_selection?: {
    selected_winner_id: string
  }
}

interface Database {
  public: {
    Tables: {
      matches: {
        Row: {
          id: string
          player1_id: string
          player2_id: string
          status: string
          winner_id: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
        }
      }
    }
  }
}

export function MyMatchesTab({ userId }: MyMatchesTabProps) {
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedCourt, setSelectedCourt] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>()
  const [duration, setDuration] = useState<string>()
  const [weatherData, setWeatherData] = useState<WeatherForecast | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [filter, setFilter] = useState<RequestFilter>('all')
  const [matchesNeedingWinner, setMatchesNeedingWinner] = useState<MatchWithPlayers[]>([])
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchMatchRequests()
    fetchCourts()
  }, [])

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name')

      if (error) throw error
      setCourts(data)
    } catch (error) {
      console.error('Error fetching courts:', error)
      toast({
        title: "Error",
        description: "Failed to load courts. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchMatchRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from('match_requests')
        .select(`
          *,
          court:courts(
            name,
            surface,
            is_indoor
          ),
          matches!inner(
            id,
            winner_id,
            player1_id,
            player2_id,
            request_id
          ),
          responses:match_request_responses(
            id,
            status,
            responder:profiles(
              id,
              full_name,
              avatar_url,
              level,
              matches_won
            ),
            request:match_requests(
              preferred_date,
              preferred_time,
              duration,
              court:courts(
                name,
                surface,
                is_indoor
              )
            )
          )
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Match requests data:', requestsData)
      setMatchRequests(requestsData)
    } catch (error) {
      console.error('Error fetching match requests:', error)
      toast({
        title: "Error",
        description: "Failed to load match requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch weather when date or time changes
  useEffect(() => {
    async function fetchWeather() {
      if (!date || !time) {
        return
      }
      
      setIsLoadingWeather(true)
      try {
        const forecast = await fetchWeatherForecast(
          format(date, 'yyyy-MM-dd'),
          time
        )

        if (forecast) {
          setWeatherData(forecast)
        } else {
          toast({
            title: "Weather Data Unavailable",
            description: "Could not fetch weather data for the selected time.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error fetching weather:', error)
        toast({
          title: "Weather Update Failed",
          description: "Unable to fetch weather data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingWeather(false)
      }
    }

    if (date && time) {
      fetchWeather()
    }
  }, [date, time, toast])

  const handleCreateRequest = async () => {
    if (!date || !time || !duration || !selectedCourt) return

    setIsLoading(true)
    try {
      const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`)
      const endDateTime = addHours(startDateTime, parseInt(duration) / 60)

      const { data, error } = await supabase
        .from('match_requests')
        .insert({
          creator_id: userId,
          preferred_date: format(date, 'yyyy-MM-dd'),
          preferred_time: time,
          duration: `${duration} minutes`,
          court_preference: selectedCourt,
          status: 'open',
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Request Created!",
        description: "Your match request has been created successfully.",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })
      setShowNewRequest(false)
      fetchMatchRequests()
    } catch (error) {
      console.error('Error creating match request:', error)
      toast({
        title: "Error",
        description: "Failed to create match request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setDate(new Date())
    setTime(undefined)
    setDuration(undefined)
    setSelectedCourt(undefined)
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('match_requests')
        .delete()
        .eq('id', requestId)
        .eq('creator_id', userId) // Extra safety check

      if (error) throw error

      toast({
        title: "Request Cancelled",
        description: "Your match request has been cancelled successfully.",
        className: "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-none",
      })
      
      // Update the local state by removing the cancelled request
      setMatchRequests(prev => prev.filter(request => request.id !== requestId))
    } catch (error) {
      console.error('Error cancelling match request:', error)
      toast({
        title: "Error",
        description: "Failed to cancel match request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptResponse = async (responseId: string) => {
    try {
      // Get the response details first
      const { data: responseData, error: responseError } = await supabase
        .from('match_request_responses')
        .select(`
          *,
          request:match_requests!inner(*),
          responder:profiles!inner(*)
        `)
        .eq('id', responseId)
        .single()

      if (responseError) throw responseError

      // Update the response status
      const { error: updateError } = await supabase
        .from('match_request_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId)

      if (updateError) throw updateError

      // Create a match record
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          player1_id: responseData.request.creator_id,
          player2_id: responseData.responder_id,
          request_id: responseData.request_id,
          winner_id: null
        })

      if (matchError) throw matchError

      // Create a notification for the responder
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: responseData.responder_id,
          type: 'match_request_accepted',
          title: 'Match Request Accepted',
          message: 'Your match request has been accepted! Get ready to play!',
          data: {
            request_id: responseData.request_id,
            response_id: responseId
          }
        })

      if (notificationError) throw notificationError

      toast({
        title: "Response Accepted",
        description: "The player will be notified. Get ready to play!",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })

      // Refresh the requests list
      fetchMatchRequests()
      // Also refresh matches needing winner selection
      fetchMatchesNeedingWinner()
    } catch (error) {
      console.error('Error accepting response:', error)
      toast({
        title: "Error",
        description: "Failed to accept response. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRejectResponse = async (responseId: string) => {
    try {
      // Get the response details first
      const { data: responseData, error: responseError } = await supabase
        .from('match_request_responses')
        .select('*, request:match_requests(*)')
        .eq('id', responseId)
        .single()

      if (responseError) throw responseError

      // Update the response status
      const { error: updateError } = await supabase
        .from('match_request_responses')
        .update({ status: 'rejected' })
        .eq('id', responseId)

      if (updateError) throw updateError

      // Create a notification for the responder
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: responseData.responder_id,
          type: 'match_request_rejected',
          title: 'Match Request Response',
          message: 'Unfortunately, your match request was not accepted.',
          data: {
            request_id: responseData.request_id,
            response_id: responseId
          }
        })

      if (notificationError) throw notificationError

      toast({
        title: "Response Rejected",
        description: "The player has been notified.",
        className: "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-none",
      })

      // Refresh the requests list
      fetchMatchRequests()
    } catch (error) {
      console.error('Error rejecting response:', error)
      toast({
        title: "Error",
        description: "Failed to reject response. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Sort and filter match requests
  const sortedAndFilteredRequests = useMemo(() => {
    let filtered = [...matchRequests]

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(request => {
        if (filter === 'open') {
          return request.status === 'open' && (!request.responses || request.responses.every(r => r.status === 'rejected'))
        }
        if (filter === 'accepted') {
          return request.responses?.some(r => r.status === 'accepted')
        }
        if (filter === 'rejected') {
          return request.responses?.every(r => r.status === 'rejected')
        }
        return true
      })
    }

    // Sort by response status and date
    return filtered.sort((a, b) => {
      // Helper function to get request priority
      const getPriority = (request: MatchRequest) => {
        if (request.responses?.some(r => r.status === 'pending')) return 0 // Highest priority - waiting for accept
        if (request.responses?.some(r => r.status === 'accepted')) return 1
        if (!request.responses || request.responses.length === 0) return 2 // Open requests with no responses
        if (request.responses?.every(r => r.status === 'rejected')) return 3
        return 2 // Default case
      }

      const priorityA = getPriority(a)
      const priorityB = getPriority(b)

      // First sort by priority
      if (priorityA !== priorityB) return priorityA - priorityB

      // For same priority, sort by date (newest first)
      const aDateTime = new Date(a.preferred_date + ' ' + a.preferred_time).getTime()
      const bDateTime = new Date(b.preferred_date + ' ' + b.preferred_time).getTime()
      return bDateTime - aDateTime
    })
  }, [matchRequests, filter])

  // Function to fetch matches that need winner selection
  const fetchMatchesNeedingWinner = async () => {
    try {
      type MatchResponse = {
        id: string;
        player1: {
          id: string;
          full_name: string;
          avatar_url: string | null;
        };
        player2: {
          id: string;
          full_name: string;
          avatar_url: string | null;
        };
        match_request: {
          preferred_date: string;
          preferred_time: string;
          duration: string;
        };
        current_selection?: {
          selected_winner_id: string;
        };
        other_player_selection?: {
          selected_winner_id: string;
        };
      };

      console.log('Fetching matches needing winner...');
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          id,
          player1:profiles!matches_player1_id_fkey(id, full_name, avatar_url),
          player2:profiles!matches_player2_id_fkey(id, full_name, avatar_url),
          match_request:match_requests(preferred_date, preferred_time, duration)
        `)
        .is('winner_id', null)
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .returns<MatchResponse[]>();

      if (error) throw error

      // Get all winner selections for these matches
      const { data: selections, error: selectionsError } = await supabase
        .from('match_winner_selections')
        .select('match_id, selector_id, selected_winner_id')
        .in('match_id', matchesData?.map(m => m.id) || [])

      if (selectionsError) throw selectionsError

      // Process matches with selections
      const processedMatches: MatchResponse[] = (matchesData || []).map(match => {
        const matchSelections = selections?.filter(s => s.match_id === match.id) || []
        const userSelection = matchSelections.find(s => s.selector_id === userId)
        const otherPlayerSelection = matchSelections.find(s => s.selector_id !== userId)

        return {
          ...match,
          current_selection: userSelection ? {
            selected_winner_id: userSelection.selected_winner_id
          } : undefined,
          other_player_selection: otherPlayerSelection ? {
            selected_winner_id: otherPlayerSelection.selected_winner_id
          } : undefined
        }
      })

      // Filter matches that have ended
      const currentTime = new Date();
      const needSelection = processedMatches.filter(match => {
        if (!match.match_request) return false;

        const matchDateTime = new Date(`${match.match_request.preferred_date}T${match.match_request.preferred_time}`);
        const [hours, minutes] = match.match_request.duration.split(':').map(Number);
        const durationInMinutes = (hours * 60) + minutes;
        const matchEndTime = new Date(matchDateTime.getTime() + durationInMinutes * 60000);
        return currentTime > matchEndTime;
      })

      setMatchesNeedingWinner(needSelection)
    } catch (error) {
      console.error('Error fetching matches needing winner:', error)
      toast({
        title: "Error",
        description: "Failed to load matches needing winner selection.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchMatchesNeedingWinner()
  }, [userId])

  const handleWinnerSelection = async (matchId: string, winnerId: string) => {
    try {
      const response = await fetch('/api/matches/select-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          selectedWinnerId: winnerId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to select winner')
      }

      let toastMessage = ''
      switch (data.status) {
        case 'completed':
          toastMessage = 'Winner confirmed! The match has been completed.'
          break
        case 'disputed':
          toastMessage = 'There is a disagreement about the winner. Please discuss with your opponent and try again.'
          break
        case 'pending':
          toastMessage = 'Your selection has been recorded. Waiting for the other player to confirm.'
          break
      }

      toast({
        title: data.status === 'disputed' ? 'Match Result Dispute' : 'Winner Selection',
        description: toastMessage,
        variant: data.status === 'disputed' ? 'destructive' : 'default',
      })

      // Refresh the list of matches needing winner selection
      fetchMatchesNeedingWinner()
    } catch (error) {
      console.error('Error selecting winner:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record your winner selection. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Subscribe to match updates
  useEffect(() => {
    const channel = supabase
      .channel('match-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `player1_id.eq.${userId},player2_id.eq.${userId}`,
        },
        (payload) => {
          console.log('Match updated:', payload)
          // If a winner was set, update the local state
          if (payload.new.winner_id) {
            setMatchesNeedingWinner(prev => 
              prev.filter(match => match.id !== payload.new.id)
            )
            // Close the dialog if it's open
            setOpenDialogs(prev => ({
              ...prev,
              [payload.new.id]: false
            }))
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  // Also subscribe to match_winner_selections updates
  useEffect(() => {
    const channel = supabase
      .channel('winner-selection-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_winner_selections',
        },
        () => {
          // Refetch matches needing winner when selections change
          void fetchMatchesNeedingWinner()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <div className="space-y-6">
      {/* Winner Selection Dialogs */}
      {matchesNeedingWinner.length > 0 && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Pending Match Results
              </h3>
              <p className="text-sm text-muted-foreground">
                Please select the winners for your completed matches
              </p>
            </div>
            <Badge variant="secondary" className="h-7 px-3">
              {matchesNeedingWinner.length} {matchesNeedingWinner.length === 1 ? 'match' : 'matches'} pending
            </Badge>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {matchesNeedingWinner.map((match) => (
                <div key={match.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenDialogs(prev => ({ ...prev, [match.id]: true }))}
                    className="w-full p-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground group flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="font-medium">
                        {match.player1.full_name} vs {match.player2.full_name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(match.match_request.preferred_date), 'MMM d')} at {match.match_request.preferred_time}
                        {match.current_selection && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-primary">Waiting for other player's selection...</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-current" />
                  </div>
                  <Dialog 
                    open={openDialogs[match.id] || false}
                    onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, [match.id]: open }))}
                  >
                    <WinnerSelectionDialog
                      match={match}
                      onSelect={(winnerId) => handleWinnerSelection(match.id, winnerId)}
                      open={openDialogs[match.id] || false}
                      onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, [match.id]: open }))}
                    />
                  </Dialog>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">My Match Requests</h2>
        <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
          <DialogTrigger asChild>
            <Button>New Request</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create Match Request</DialogTitle>
              <DialogDescription>
                Select your preferred date, time, and court for the match.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar Section */}
              <Card className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </Card>

              {/* Time, Weather, and Court Selection */}
              <Card className="p-4">
                {date && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                    </div>

                    {/* Weather Information */}
                    {weatherData && (
                      <div className="flex items-center space-x-4 p-4 rounded-lg bg-background/50 border border-border/50">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Sun className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Thermometer className="h-4 w-4 text-primary" />
                            <span className="font-medium">{weatherData.temperature}°C</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{weatherData.condition}</p>
                        </div>
                      </div>
                    )}

                    {/* Time Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Select Time
                      </label>
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_TIMES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duration Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration</label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Court Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preferred Court</label>
                      <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select court" />
                        </SelectTrigger>
                        <SelectContent>
                          {courts.map((court) => (
                            <SelectItem key={court.id} value={court.id}>
                              {court.name} ({court.surface}, {court.is_indoor ? 'Indoor' : 'Outdoor'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm()
                setShowNewRequest(false)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRequest} 
                disabled={isLoading || !date || !time || !duration || !selectedCourt}
              >
                Create Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="w-[200px]">
          <Select value={filter} onValueChange={(value) => setFilter(value as RequestFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter requests" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedAndFilteredRequests.length} {sortedAndFilteredRequests.length === 1 ? 'request' : 'requests'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAndFilteredRequests.map((request) => (
          <div key={request.id} className="space-y-4">
            <Card 
              className={cn(
                "relative overflow-hidden",
                request.responses?.some(r => r.status === 'accepted') && "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20",
                request.responses && request.responses.length > 0 && request.responses.every(r => r.status === 'rejected') && "bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30"
              )}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {format(new Date(request.preferred_date), 'MMM d')} at {request.preferred_time}
                      </CardTitle>
                      {request.matches?.some(match => match.winner_id === userId) && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      {request.court?.name}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={request.status === "confirmed" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{request.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {request.court?.is_indoor ? (
                        <Cloud className="h-3.5 w-3.5" />
                      ) : (
                        <Sun className="h-3.5 w-3.5" />
                      )}
                      <span>{request.court?.surface}</span>
                    </div>
                  </div>

                  {/* Show responses if there are any */}
                  {request.responses && request.responses.length > 0 && (
                    <div className="space-y-3 pt-2 border-t">
                      {request.responses.map((response) => (
                        <div key={response.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getAvatarUrl(response.responder.avatar_url) || undefined} />
                              <AvatarFallback>
                                {response.responder.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{response.responder.full_name}</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Trophy className="h-3 w-3" />
                                <span>Level {response.responder.level}</span>
                                <span>•</span>
                                <span>{response.responder.matches_won} wins</span>
                              </div>
                            </div>
                          </div>
                          {response.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs hover:bg-destructive/90 hover:text-destructive-foreground"
                                onClick={() => handleRejectResponse(response.id)}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => handleAcceptResponse(response.id)}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Accept
                              </Button>
                            </div>
                          ) : (
                            <Badge variant={response.status === 'accepted' ? 'default' : 'secondary'}>
                              {response.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </span>
                    {!request.responses?.some(r => r.status === 'accepted') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 px-2 text-xs hover:bg-destructive/90 hover:text-destructive-foreground"
                          >
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Match Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this match request? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Request</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelRequest(request.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, Cancel Request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {sortedAndFilteredRequests.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No match requests found for the selected filter.
          </div>
        )}
      </div>
    </div>
  )
} 