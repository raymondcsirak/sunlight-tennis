"use client"

import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Cloud, Sun, Trophy, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlayerStatsCard } from "@/app/_components/player-stats/player-stats-card"
import { createBrowserClient } from "@supabase/ssr"

// Helper function to get the full avatar URL
function getAvatarUrl(path: string | null) {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

interface PlayerStats {
  totalMatches: number
  wonMatches: number
  winRate: number
  level: number
}

interface Response {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  responder: {
    id: string
    full_name: string
    avatar_url: string | null
    level: number
    stats?: PlayerStats
  }
  request?: {
    preferred_date: string
    preferred_time: string
    duration: string
    court?: {
      name: string
      surface: string
      is_indoor: boolean
    }
  }
}

interface MatchResponsesProps {
  responses: Response[]
  onAccept: (responseId: string) => void
  onReject: (responseId: string) => void
}

export function MatchResponses({ responses, onAccept, onReject }: MatchResponsesProps) {
  // Group responses by status
  const acceptedResponses = responses.filter(r => r.status === 'accepted')
  const pendingResponses = responses.filter(r => r.status === 'pending')
  const rejectedResponses = responses.filter(r => r.status === 'rejected')

  return (
    <div className="space-y-4">
      {acceptedResponses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-green-500 mb-2">Accepted</h3>
          {acceptedResponses.map((response) => (
            <ResponseCard
              key={response.id}
              response={response}
              showActions={false}
            />
          ))}
        </div>
      )}

      {pendingResponses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-blue-500 mb-2">Pending Responses</h3>
          {pendingResponses.map((response) => (
            <ResponseCard
              key={response.id}
              response={response}
              showActions={true}
              onAccept={() => onAccept(response.id)}
              onReject={() => onReject(response.id)}
            />
          ))}
        </div>
      )}

      {rejectedResponses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Rejected</h3>
          {rejectedResponses.map((response) => (
            <ResponseCard
              key={response.id}
              response={response}
              showActions={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ResponseCardProps {
  response: Response
  showActions: boolean
  onAccept?: () => void
  onReject?: () => void
}

function ResponseCard({ response, showActions, onAccept, onReject }: ResponseCardProps) {
  const initials = response.responder.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  // Create default stats if none are provided
  const stats = {
    totalMatches: response.responder.stats?.totalMatches ?? 0,
    wonMatches: response.responder.stats?.wonMatches ?? 0,
    winRate: response.responder.stats?.winRate ?? 0,
    level: response.responder.level
  }

  return (
    <Card className={cn(
      "p-4 mb-2",
      response.status === 'accepted' && "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/30 transition-colors",
      response.status === 'rejected' && "bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30 hover:border-destructive/40 transition-colors"
    )}>
      <div className="space-y-4">
        {/* Match Details Section */}
        {response.request && (
          <div className={cn(
            "flex items-center justify-between text-sm text-muted-foreground border-b pb-3",
            response.status === 'accepted' && "border-green-500/20",
            response.status === 'rejected' && "border-destructive/30",
            response.status === 'pending' && "border-border/50"
          )}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{format(new Date(response.request.preferred_date), 'MMM d')} at {response.request.preferred_time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{response.request.duration}</span>
              </div>
              {response.request.court?.name && (
                <div className="flex items-center gap-1.5">
                  <span>•</span>
                  <span>{response.request.court.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {response.request.court?.is_indoor ? (
                <Cloud className="h-3.5 w-3.5" />
              ) : (
                <Sun className="h-3.5 w-3.5" />
              )}
              <span>{response.request.court?.surface}</span>
            </div>
          </div>
        )}

        {/* Player Info Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={getAvatarUrl(response.responder.avatar_url) || undefined} className="object-cover aspect-square" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{response.responder.full_name}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PlayerStatsCard stats={stats} variant="compact" />
              </div>
            </div>
          </div>

          {showActions && response.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                onClick={onAccept}
                className="h-7 w-7 bg-green-500 hover:bg-green-600 text-white"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={onReject}
                className="h-7 w-7 hover:bg-destructive/90 hover:text-destructive-foreground hover:border-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

interface Match {
  winner_id: string | null
  player1_id: string
  player2_id: string
}

async function fetchMatchResponses(requestId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get the responses with all necessary data in a single query
  const { data: responseData, error: responseError } = await supabase
    .from('match_request_responses')
    .select(`
      *,
      responder:profiles(
        id,
        full_name,
        avatar_url,
        level,
        player_stats:player_xp(current_level),
        matches:matches(winner_id, player1_id, player2_id)
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
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });

  if (responseError) {
    console.error('Error fetching match responses:', responseError);
    return [];
  }

  // Process the responses to calculate stats
  const responsesWithStats = responseData.map((response) => {
    // Get all matches where the responder was a player
    const matches = (response.responder.matches || []) as Match[];
    const playerMatches = matches.filter((match: Match) => 
      match.player1_id === response.responder.id || 
      match.player2_id === response.responder.id
    );
    
    // Calculate stats
    const totalMatches = playerMatches.length;
    const wonMatches = playerMatches.filter((match: Match) => match.winner_id === response.responder.id).length;
    const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0;
    
    // Get the level from player_xp or fallback to profile level
    const playerStats = response.responder.player_stats?.[0];
    const level = playerStats?.current_level || response.responder.level || 1;

    return {
      ...response,
      responder: {
        id: response.responder.id,
        full_name: response.responder.full_name,
        avatar_url: response.responder.avatar_url,
        level,
        stats: {
          totalMatches,
          wonMatches,
          winRate,
          level
        }
      }
    };
  });

  return responsesWithStats;
} 