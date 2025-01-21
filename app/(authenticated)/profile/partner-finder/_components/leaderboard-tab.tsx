"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal } from "lucide-react"
import { getLeaderboard } from "@/app/_components/player-stats/actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Interfete pentru datele jucatorilor din clasament
// Definesc structura pentru statistici si informatii despre jucatori
interface LeaderboardPlayer {
  user_id: string
  current_level: number
  total_matches: number
  won_matches: number
  win_rate: number
  profiles: {
    full_name: string
    avatar_url: string | null
  }
}

interface LeaderboardTabProps {
  userId: string
}

// Functionalitati pentru calculul pozitiilor
// Include logica pentru:
// - Calculul scorului total
// - Determinarea pozitiei in clasament
// - Actualizari ale clasamentului
function getAvatarUrl(path: string | null) {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

// Componenta principala pentru tab-ul de clasament
// Gestioneaza:
// - Afisarea clasamentului cu statistici
// - Sistemul de filtrare si sortare
// - Actualizari periodice ale datelor
// - Paginare si performanta
export function LeaderboardTab({ userId }: LeaderboardTabProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await getLeaderboard()
        setPlayers(data)
      } catch (error) {
        console.error('Error loading leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Leaderboard</h2>
        <Card className="p-6">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Leaderboard</h2>
      <Card className="p-6">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {players.map((player, index) => (
              <div
                key={player.user_id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border",
                  player.user_id === userId && "bg-accent"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 font-semibold text-muted-foreground">
                    {index + 1}.
                  </div>
                  <Avatar className="h-10 w-10 overflow-hidden">
                    <AvatarImage 
                      src={getAvatarUrl(player.profiles.avatar_url) || undefined} 
                      className="object-cover aspect-square w-full h-full"
                    />
                    <AvatarFallback className="text-base">
                      {player.profiles.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {player.profiles.full_name}
                      {index === 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                      {index === 1 && (
                        <Medal className="h-4 w-4 text-gray-400" />
                      )}
                      {index === 2 && (
                        <Medal className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        Level {player.current_level}
                      </Badge>
                      <span>•</span>
                      <span>{player.total_matches} matches</span>
                      <span>•</span>
                      <span>{player.won_matches} wins</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">
                    {player.win_rate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Win Rate
                  </div>
                </div>
              </div>
            ))}

            {players.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No players found.
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
} 