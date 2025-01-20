"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Interfata pentru proprietatile componentei MatchesTab
interface MatchesTabProps {
  userId: string
}

// Interfata pentru structura unui meci
interface Match {
  id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  score: string | null
  status: string
  created_at: string
  opponent: {
    full_name: string | null
  }
}

// Componenta principala pentru tab-ul de meciuri
export function MatchesTab({ userId }: MatchesTabProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Hook pentru incarcarea meciurilor utilizatorului
  useEffect(() => {
    async function loadMatches() {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          opponent:profiles!player2_id(full_name)
        `)
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error loading matches:", error)
        return
      }

      setMatches(data || [])
      setIsLoading(false)
    }

    loadMatches()
  }, [userId, supabase])

  // Afisare mesaj de incarcare
  if (isLoading) {
    return <div>Loading matches...</div>
  }

  // Afisare mesaj cand nu exista meciuri
  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Matches Yet</CardTitle>
          <CardDescription>
            You haven't played any matches yet. Start by finding a partner and scheduling a match!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Afisare lista de meciuri
  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                vs {match.opponent?.full_name || "Unknown Player"}
              </CardTitle>
              <Badge variant={match.status === "completed" ? "default" : "secondary"}>
                {match.status}
              </Badge>
            </div>
            <CardDescription>
              {new Date(match.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {match.status === "completed" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Score:</span>
                  <span className="font-medium">{match.score || "Not recorded"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Result:</span>
                  <span className="font-medium">
                    {match.winner_id === userId ? "Won" : "Lost"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 