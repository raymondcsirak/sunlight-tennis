"use client"

import { Card } from "@/components/ui/card"

interface PlayerStats {
  totalMatches: number
  wonMatches: number
  winRate: number
  level: number
}

interface PlayerStatsCardProps {
  stats: PlayerStats
  variant?: "compact" | "full"
}

const defaultStats: PlayerStats = {
  totalMatches: 0,
  wonMatches: 0,
  winRate: 0,
  level: 1
}

export function PlayerStatsCard({ stats = defaultStats, variant = "compact" }: PlayerStatsCardProps) {
  // Ensure we always have valid stats by merging with defaults
  const safeStats = { ...defaultStats, ...stats }

  if (variant === "compact") {
    return (
      <div className="w-full grid grid-cols-2 gap-2">
        <Card className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-2xl font-bold">{safeStats.level}</div>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm text-muted-foreground">Wins</div>
          <div className="text-2xl font-bold">{safeStats.wonMatches}</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Total Matches</h3>
        <p className="text-3xl font-bold mt-2">{safeStats.totalMatches}</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg">Win Rate</h3>
        <p className="text-3xl font-bold mt-2 text-green-500">{safeStats.winRate}%</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg">Level</h3>
        <p className="text-3xl font-bold mt-2">{safeStats.level}</p>
      </Card>
    </div>
  )
} 