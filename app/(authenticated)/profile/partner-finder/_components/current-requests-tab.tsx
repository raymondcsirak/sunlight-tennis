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
import { getPlayerStats } from "@/app/_components/player-stats/actions"

// Componenta pentru afisarea si gestionarea cererilor curente de parteneriat
// Permite utilizatorilor sa vada si sa gestioneze cererile active pentru meciuri
// Implementeaza functionalitati de filtrare si sortare a cererilor

// Interfete pentru tipurile de date folosite in cereri
// Definesc structura pentru cereri si raspunsuri
interface CurrentRequestsTabProps {
  userId: string
}

interface MatchRequestResponse {
  id: string
  responder_id: string
  status: 'pending' | 'accepted' | 'rejected'
  responder: {
    full_name: string
  }
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
    player_xp: {
      current_level: number
    }
    stats?: {
      totalMatches: number
      wonMatches: number
      winRate: number
    }
  }
  court?: {
    id: string
    name: string
    surface: string
    is_indoor: boolean
  }
  responses?: MatchRequestResponse[]
}

// Functie pentru a obtine URL-ul complet pentru avatar
function getAvatarUrl(path: string | null) {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

// Componenta principala pentru tab-ul de cereri curente
// Gestioneaza:
// - Afisarea listei de cereri active
// - Filtrarea dupa data si nivel
// - Actiuni pentru cereri (acceptare/respingere)
// - Notificari pentru actualizari
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

  // Subscriere real-time pentru cererile de meciuri
  useEffect(() => {
    const requestsChannel = supabase
      .channel('open-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_requests',
          filter: `creator_id=neq.${userId}`,
        },
        () => {
          // Refetch requests
          void fetchRequests()
        }
      )
      .subscribe()

    const responsesChannel = supabase
      .channel('request-responses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_request_responses',
        },
        () => {
          // Refetch requests
          void fetchRequests()
        }
      )
      .subscribe()

    // Curatare subscrieri la unmount
    return () => {
      void supabase.removeChannel(requestsChannel)
      void supabase.removeChannel(responsesChannel)
    }
  }, [userId])

  const fetchRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from('match_requests')
        .select(`
          *,
          creator:profiles!match_requests_creator_id_fkey(
            full_name,
            avatar_url
          ),
          court:courts(
            id,
            name,
            surface,
            is_indoor
          ),
          responses:match_request_responses(
            id,
            responder_id,
            status,
            responder:profiles(
              full_name
            )
          )
        `)
        .neq('creator_id', userId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtrare cereri:
      // 1. Au orice raspunsuri (pending sau acceptat)
      // 2. Nu sunt in status 'open'
      const filteredRequests = requestsData?.filter(request => {
        // Verifica daca statusul este 'open'
        if (request.status !== 'open') return false;
        
        // Verifica daca exista orice raspunsuri
        if (!request.responses) return true;
        
        // Filtreaza daca exista orice raspunsuri (pending sau acceptat)
        return !request.responses.some((response: MatchRequestResponse) => 
          response.status === 'pending' || response.status === 'accepted'
        );
      }) || [];

      // Obtine ID-urile userilor care au creat cererile  
      const creatorIds = filteredRequests.map(request => request.creator_id)
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('user_id, current_level, won_matches')
        .in('user_id', creatorIds)

      // Creeaza un map de stats pentru useri
      const statsMap = Object.fromEntries(
        (statsData || []).map(stat => [stat.user_id, stat])
      )

      // Proceseaza cererile
      const processedRequests = filteredRequests.map(request => ({
        ...request,
        creator: {
          ...request.creator,
          player_xp: {
            current_level: statsMap[request.creator_id]?.current_level ?? 1
          },
          stats: {
            wonMatches: statsMap[request.creator_id]?.won_matches ?? 0
          }
        }
      }))

      setRequests(processedRequests)
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
      // Obtine profilul userului curent
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Start o tranzactie pentru a actualiza cererea si a crea/actualiza raspunsul
      const { data: responseData, error: responseError } = await supabase.rpc('handle_match_request_acceptance', {
        p_request_id: requestId,
        p_responder_id: userId
      })

      if (responseError) throw responseError

      // Creeaza o notificare pentru creatorul cererii
      const request = requests.find(r => r.id === requestId)
      if (!request) throw new Error('Request not found')

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.creator_id,
          type: 'match_request_response',
          title: 'New Match Request Response',
          message: `${profileData.full_name} wants to join your match request.`,
          data: {
            request_id: requestId,
            response_id: responseData.id
          }
        })

      if (notificationError) throw notificationError

      toast({
        title: "Request Sent!",
        description: "The match creator will be notified of your interest.",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })

      // Actualizeaza lista de cereri
      fetchRequests()
    } catch (error) {
      console.error('Error accepting request:', error)
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
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
            className="relative overflow-hidden max-w-[280px] mx-auto w-full"
          >
            <CardHeader className="text-center p-4 pb-2">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={getAvatarUrl(request.creator.avatar_url) || undefined} className="object-cover aspect-square" />
                  <AvatarFallback>{request.creator.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg font-semibold">
                  {request.creator.full_name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    Level {request.creator.player_xp.current_level}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    <span>{request.creator.stats?.wonMatches ?? 0} wins</span>
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
                  className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={request.responses?.some(r => r.responder_id === userId && r.status === 'pending')}
                >
                  {request.responses?.some(r => r.responder_id === userId && r.status === 'pending')
                    ? 'Request Sent'
                    : "Let's Play"
                  }
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