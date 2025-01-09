"use client"

import { Card } from "@/components/ui/card"

interface LeaderboardTabProps {
  userId: string
}

export function LeaderboardTab({ userId }: LeaderboardTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Leaderboard</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Coming soon...</p>
      </Card>
    </div>
  )
} 