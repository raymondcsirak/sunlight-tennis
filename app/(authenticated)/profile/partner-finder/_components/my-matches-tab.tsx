"use client"

import { useEffect, useState, useMemo, useRef, memo } from "react"
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
import { PlayerStatsCard } from "@/app/_components/player-stats/player-stats-card"
import { getPlayerStats } from "@/app/_components/player-stats/actions"
import { useVirtualizer } from '@tanstack/react-virtual'

// Functie pentru a obtine URL-ul complet pentru avatar
function getAvatarUrl(path: string | null) {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

interface MyMatchesTabProps {
  userId: string
}

const AVAILABLE_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

const DURATIONS = [
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' }
]

interface PlayerStats {
      totalMatches: number
      wonMatches: number
      winRate: number
      level: number
    }

interface Responder {
    id: string
    full_name: string
    avatar_url: string | null
  player_xp: {
      current_level: number
    }
    stats?: {
      wonMatches: number
    }
  }

interface Response {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  responder: Responder
}

interface DatabaseMatchRequest {
  id: string
  creator_id: string
  preferred_date: string
  preferred_time: string
  duration: string
  court_preference: string
  status: string
  created_at: string
  court?: {
    id: string
    name: string
    surface: string
    is_indoor: boolean
  }
  match_request_responses?: Array<{
    id: string
    status: 'pending' | 'accepted' | 'rejected'
    responder: {
      id: string
      full_name: string
      avatar_url: string | null
      player_xp: Array<{
        current_level: number
      }>
    }
  }>
  matches?: Array<{
    id: string
    winner_id: string | null
    player1_id: string
    player2_id: string
    request_id: string
  }>
}

interface ExtendedMatchRequest extends DatabaseMatchRequest {
  request_type: 'creator' | 'player'
  responses: Response[]
  matches?: Array<{
    id: string
    winner_id: string | null
    player1_id: string
    player2_id: string
    request_id: string
  }>
}

// Actualizeaza tipul MatchRequest pentru a folosi noua interfata
type MatchRequest = ExtendedMatchRequest

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
      // Inchide doar daca nu exista alt raspuns sau daca ambii sunt de acord
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
  // Selecteaza castigatorul meciului
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

      {/* Detalii meci */}
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

      {/* Selectie jucator */}
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
// Tip pentru meciuri cu jucatori
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
// Tip pentru baza de date
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
// Tip pentru meciuri cu jucatori
interface PlayerMatch {
  id: string
  winner_id: string | null
  player1_id: string
  player2_id: string
  request_id: string
  status: string
  match_request: MatchRequest
}
// Tip pentru meciuri cu baza de date
interface DatabaseMatch {
  id: string
  winner_id: string | null
  player1_id: string
  player2_id: string
  request_id: string
  match_request: DatabaseMatchRequest
  player1: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  player1_xp: Array<{
    current_level: number
  }>
  player2: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  player2_xp: Array<{
    current_level: number
  }>
}
// Tip pentru cardurile de meci
interface MatchCardProps {
  request: MatchRequest
  userId: string
  onCancelRequest: (requestId: string) => Promise<void>
  onAcceptResponse: (responseId: string) => Promise<void>
  onRejectResponse: (responseId: string) => Promise<void>
  onDeleteMatch: (requestId: string) => Promise<void>
}

const MatchCard = memo(function MatchCard({ 
  request, 
  userId, 
  onCancelRequest, 
  onAcceptResponse, 
  onRejectResponse,
  onDeleteMatch
}: MatchCardProps) {
  return (
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
              {request.matches?.some(match => 
                match.winner_id === userId && 
                (match.player1_id === userId || match.player2_id === userId) &&
                match.request_id === request.id
              ) && (
                <Trophy className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">
              {request.court?.name}
            </CardDescription>
          </div>
          <Badge 
            variant={request.matches?.some(match => 
              match.winner_id && 
              (match.player1_id === userId || match.player2_id === userId)
            ) 
              ? "outline"
              : request.status === "confirmed" 
                ? "default" 
                : "secondary"}
            className={cn(
              "text-xs",
              request.matches?.some(match => match.winner_id === userId) && "text-yellow-500 border-yellow-500/20",
              request.matches?.some(match => 
                match.winner_id && match.winner_id !== userId &&
                (match.player1_id === userId || match.player2_id === userId)
              ) && "text-destructive border-destructive/20",
              !request.responses?.some(r => r.status === 'accepted') && request.status === "open" && "block",
              request.responses?.some(r => r.status === 'accepted') && !request.matches?.some(match => match.winner_id) && "hidden"
            )}
          >
            {request.matches?.some(match => match.winner_id === userId)
              ? "Match Won!"
              : request.matches?.some(match => 
                  match.winner_id && match.winner_id !== userId &&
                  (match.player1_id === userId || match.player2_id === userId)
                )
                ? "Match Lost!"
                : request.status}
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

          {/* Afiseaza raspunsuri daca sunt */}
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          Level {response.responder.player_xp.current_level}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          <span>{response.responder.stats?.wonMatches ?? 0} wins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {response.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs hover:bg-destructive/90 hover:text-destructive-foreground"
                        onClick={() => onRejectResponse(response.id)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => onAcceptResponse(response.id)}
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
            {!request.responses?.some(r => r.status === 'accepted') ? (
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
                      onClick={() => onCancelRequest(request.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Cancel Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : request.responses?.some(r => r.status === 'accepted') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-destructive/90 hover:text-destructive-foreground"
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Match Record</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this match record? This will hide the match from your history but will preserve all XP and win records. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Match</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteMatch(request.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Delete Match
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
// Componenta pentru tab-ul de meciuri mele
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
  const [matchesNeedingWinner, setMatchesNeedingWinner] = useState<MatchWithPlayers[]>([])
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({})
  const parentRef = useRef<HTMLDivElement>(null)
  const [parentWidth, setParentWidth] = useState(0)

  // Actualizeaza latimea parintelui la montare si la redimensionare
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setParentWidth(parentRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Calculeaza numarul de coloane in functie de latimea parintelui
  const numColumns = useMemo(() => {
    if (parentWidth < 640) return 1 // mobile
    if (parentWidth < 1024) return 2 // tablet
    return 3 // desktop
  }, [parentWidth])

  // Sorteaza cererile de meciuri
  const sortedAndFilteredRequests = useMemo(() => {
    let filtered = [...matchRequests]

    // Sorteaza dupa data si statusul meciului
    return filtered.sort((a, b) => {
      // Functie pentru a obtine prioritate
      const getPriority = (request: MatchRequest) => {
        // Cererile asteptand confirmare intai
        if (request.responses?.some(r => r.status === 'pending')) return 0
        
        // Apoi meciurile completate
        if (request.matches?.some(match => 
          match.winner_id !== null && 
          (match.player1_id === userId || match.player2_id === userId)
        )) return 1
        
        // Apoi meciurile acceptate dar nu jucate
        if (request.responses?.some(r => r.status === 'accepted')) return 2
        
        // Apoi cererile deschise cu niciun raspuns
        if (!request.responses || request.responses.length === 0) return 3
        
        // In sfarsit cererile respinse
        if (request.responses?.every(r => r.status === 'rejected')) return 4
        
        return 3
      }

      const priorityA = getPriority(a)
      const priorityB = getPriority(b)

      // Daca prioritatile sunt diferite, sorteaza dupa prioritate
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // Daca prioritatile sunt aceleasi, sorteaza dupa data (in ordine ascendenta)
      const aDateTime = new Date(a.preferred_date + ' ' + a.preferred_time).getTime()
      const bDateTime = new Date(b.preferred_date + ' ' + b.preferred_time).getTime()
      return aDateTime - bDateTime
    })
  }, [matchRequests, userId])

  // Calculeaza numarul de randuri pentru virtualizare
  const rows = useMemo(() => {
    return Math.ceil(sortedAndFilteredRequests.length / numColumns)
  }, [sortedAndFilteredRequests.length, numColumns])

  interface VirtualItem {
    index: number;
    start: number;
    end: number;
    size: number;
    lane: number;
  }

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Inaltimea estimata a unui rand
    overscan: 5, // Numarul de randuri pentru a fi renderizate in afara zonei vizibile
  })

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

  async function fetchMatchRequests() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      // Primul, obtine cererile creatorilor cu toate datele in cauza intr-o singura cerere
      const { data: creatorRequests, error: creatorError } = await supabase
        .from("match_requests")
        .select(`
          id,
          creator_id,
          preferred_date,
          preferred_time,
          duration,
          status,
          created_at,
          court_preference,
          court:courts(
            id,
            name,
            surface,
            is_indoor
          ),
          match_request_responses(
            id,
            status,
            responder:profiles!match_request_responses_responder_id_fkey(
              id,
              full_name,
              avatar_url
            )
          ),
          matches(
            id,
            winner_id,
            player1_id,
            player2_id,
            request_id
          )
        `)
        .eq("creator_id", userId)
        .neq("status", "deleted")
        .returns<DatabaseMatchRequest[]>()

      if (creatorError) throw creatorError

      // Apoi, obtine meciurile jucatorilor cu toate datele in cauza intr-o singura cerere
      const { data: playerMatches, error: matchError } = await supabase
        .from("matches")
        .select(`
          id,
          winner_id,
          player1_id,
          player2_id,
          request_id,
          match_request:match_requests!inner(
            id,
            creator_id,
            preferred_date,
            preferred_time,
            duration,
            status,
            created_at,
            court_preference,
            court:courts(
              id,
              name,
              surface,
              is_indoor
            ),
            match_request_responses(
              id,
              status,
              responder:profiles!match_request_responses_responder_id_fkey(
                id,
                full_name,
                avatar_url
              )
            )
          ),
          player1:profiles!matches_player1_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          player2:profiles!matches_player2_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .not('request_id', 'is', null)
        .not('match_request.status', 'eq', 'deleted')
        .returns<DatabaseMatch[]>()

      if (matchError) throw matchError

      // Obtine toate ID-urile raspunsurilor unice
      const responderIds = new Set<string>()
      creatorRequests?.forEach(request => {
        request.match_request_responses?.forEach(response => {
          responderIds.add(response.responder.id)
        })
      })

      // Adauga toate ID-urile jucatorilor unice din meciuri
      playerMatches?.forEach(match => {
        responderIds.add(match.player1_id)
        responderIds.add(match.player2_id)
      })

      // Obtine statistici pentru toate jucatorii
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('user_id, current_level, won_matches')
        .in('user_id', Array.from(responderIds))

      // Creeaza un map de statistici dupa ID-ul jucatorului
      const statsMap = Object.fromEntries(
        (statsData || []).map(stat => [stat.user_id, stat])
      )

      // Creeaza un Set pentru a urmari ID-urile cererilor procesate
      const processedRequestIds = new Set<string>()

      // Proceseaza cererile creatorilor cu statistici
      const processedCreatorRequests: ExtendedMatchRequest[] = (creatorRequests || []).map(request => {
        const processedResponses = request.match_request_responses?.map(response => ({
          id: response.id,
          status: response.status,
          responder: {
            id: response.responder.id,
            full_name: response.responder.full_name,
            avatar_url: response.responder.avatar_url,
            player_xp: {
              current_level: statsMap[response.responder.id]?.current_level ?? 1
            },
            stats: {
              wonMatches: statsMap[response.responder.id]?.won_matches ?? 0
            }
          }
        })) || []

        return {
          ...request,
          request_type: 'creator',
          responses: processedResponses,
          matches: request.matches
        }
      })

      // Proceseaza meciurile jucatorilor in formatul cererilor
      const processedPlayerRequests: ExtendedMatchRequest[] = (playerMatches || [])
        .map(match => {
        if (!match.match_request || processedRequestIds.has(match.match_request.id)) {
          return null
        }

        processedRequestIds.add(match.match_request.id)
          const request = match.match_request

          // Determina daca jucatorul curent este player1 sau player2
          const isPlayer1 = match.player1_id === userId
          const opponent = isPlayer1 ? match.player2 : match.player1
          const opponentId = isPlayer1 ? match.player2_id : match.player1_id

          // Creeaza un raspuns care reprezinta meciul acceptat
          const processedResponses = [{
            id: `${match.id}-response`,
            status: 'accepted' as const,
            responder: {
              id: opponent.id,
              full_name: opponent.full_name,
              avatar_url: opponent.avatar_url,
              player_xp: {
                current_level: statsMap[opponentId]?.current_level ?? 1
              },
              stats: {
                wonMatches: statsMap[opponentId]?.won_matches ?? 0
              }
            }
          }]

          return {
            ...request,
            request_type: 'player',
            responses: processedResponses,
            matches: [match]
          } as ExtendedMatchRequest
        })
        .filter((request): request is ExtendedMatchRequest => request !== null)

      // Combineaza si elimina duplicatele cererilor
      const allRequests = [
        ...processedCreatorRequests,
        ...processedPlayerRequests
      ].filter((request, index, self) => 
        index === self.findIndex((r) => r.id === request.id)
      )

      // Actualizeaza starea cu toate cererile
      setMatchRequests(allRequests)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching match requests:', error)
      setIsLoading(false)
    }
  }

  // Obtine vremea cand data sau timpul se schimba
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
        .eq('creator_id', userId)

      if (error) throw error

      toast({
        title: "Request Cancelled",
        description: "Your match request has been cancelled successfully.",
        className: "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-none",
      })
      
      // Actualizeaza starea locala prin eliminarea cererii anulate
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
      // Obtine detaliile raspunsului intai
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

      // Actualizeaza statusul raspunsului
      const { error: updateError } = await supabase
        .from('match_request_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId)

      if (updateError) throw updateError

      // Creeaza un record de meci
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          player1_id: responseData.request.creator_id,
          player2_id: responseData.responder_id,
          request_id: responseData.request_id,
          winner_id: null
        })
        .select()
        .single()

      if (matchError) throw matchError

      // Foloseste functia find_or_create_thread pentru a obtine sau a crea un thread
      const { data: threadData, error: threadError } = await supabase
        .rpc('find_or_create_thread', {
          user1_id: responseData.request.creator_id,
          user2_id: responseData.responder_id
        })

      if (threadError) throw threadError

      // Actualizeaza thread-ul cu ID-ul nou de meci
      const { data: currentThread, error: fetchError } = await supabase
        .from('message_threads')
        .select('match_ids')
        .eq('id', threadData)
        .single()

      if (fetchError) throw fetchError

      const { error: threadUpdateError } = await supabase
        .from('message_threads')
        .update({
          match_ids: [...(currentThread.match_ids || []), matchData.id],
          last_message_at: new Date().toISOString()
        })
        .eq('id', threadData)

      if (threadUpdateError) throw threadUpdateError

      // Creeaza un mesaj de sistem in thread
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: threadData,
          sender_id: responseData.request.creator_id,
          content: `Match scheduled for ${format(new Date(responseData.request.preferred_date), 'MMM d')} at ${responseData.request.preferred_time}`,
          is_system_message: true,
          metadata: {
            type: 'match_accepted',
            match_id: matchData.id,
            date: responseData.request.preferred_date,
            time: responseData.request.preferred_time
          }
        })

      if (messageError) throw messageError

      // Creeaza o notificare pentru raspunsului
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

      // Actualizeaza lista cererilor
      fetchMatchRequests()
      // De asemenea, actualizeaza meciurile care au nevoie de selectie de câștigător
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
      // Apela procedura stocata pentru a gestiona respingerea
      const { error: responseError } = await supabase
        .rpc('handle_match_request_rejection', {
          p_response_id: responseId
        })

      if (responseError) throw responseError

      toast({
        title: "Response Rejected",
        description: "The match request is now available for other players.",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })

      // Actualizeaza lista cererilor
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

  // Functie pentru a obtine meciurile care au nevoie de selectie de câștigător
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

      // Obtine toate selectiile de câștigător pentru aceste meciuri
      const { data: selections, error: selectionsError } = await supabase
        .from('match_winner_selections')
        .select('match_id, selector_id, selected_winner_id')
        .in('match_id', matchesData?.map(m => m.id) || [])

      if (selectionsError) throw selectionsError

      // Proceseaza meciurile cu selectii
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

      // Filtreaza meciurile care au incheiat
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

      // Actualizeaza lista meciurilor care au nevoie de selectie de câștigător
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

  // Subscrie la meciuri
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
            // Inchide dialogul daca este deschis
            setOpenDialogs(prev => ({
              ...prev,
              [payload.new.id]: false
            }))
          }
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  // Subscrie la meciuri
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
          // Actualizeaza lista meciurilor care au nevoie de selectie de câștigător cand selectiile se schimbă
          void fetchMatchesNeedingWinner()
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  // Subscrie la raspunsurile la cereri de meci
  useEffect(() => {
    const channel = supabase
      .channel('match-response-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_request_responses',
          filter: `request_id=in.(${matchRequests.map(r => r.id).join(',')})`,
        },
        () => {
          // Actualizeaza lista cererilor de meci cand raspunsurile se schimbă
          void fetchMatchRequests()
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [matchRequests])

  const handleDeleteMatch = async (requestId: string) => {
    try {
      // Marcheaza cererea de meci ca fiind anulata
      const { error: updateError } = await supabase
        .from('match_requests')
        .update({ status: 'deleted' })
        .eq('id', requestId)

      if (updateError) throw updateError

      toast({
        title: "Match Deleted",
        description: "The match has been removed from your history.",
        className: "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-none",
      })

      // Actualizeaza lista cererilor de meci
      fetchMatchRequests()
    } catch (error) {
      console.error('Error deleting match:', error)
      toast({
        title: "Error",
        description: "Failed to delete match. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Dialoguri de selectie de câștigător */}
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

              {/* Selectie de timp, vreme, si teren */}
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

                    {/* Informatii despre vreme */}
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

                    {/* Selectie de timp */}
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

                    {/* Selectie de durata */}
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

                    {/* Selectie de teren */}
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

      <div 
        ref={parentRef} 
        className="h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowStartIndex = virtualRow.index * numColumns
            const rowRequests = sortedAndFilteredRequests.slice(rowStartIndex, rowStartIndex + numColumns)

            return (
              <div
                key={virtualRow.index}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {rowRequests.map((request) => (
                  <div key={request.id} className="space-y-4">
                    <MatchCard
                      request={request}
                      userId={userId}
                      onCancelRequest={handleCancelRequest}
                      onAcceptResponse={handleAcceptResponse}
                      onRejectResponse={handleRejectResponse}
                      onDeleteMatch={handleDeleteMatch}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {sortedAndFilteredRequests.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          No match requests found for the selected filter.
        </div>
      )}
    </div>
  )
} 