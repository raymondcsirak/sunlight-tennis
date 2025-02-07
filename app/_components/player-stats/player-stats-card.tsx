"use client"

import { Card } from "@/components/ui/card"

// Interface for player statistics data
interface PlayerStats {
  totalMatches: number  // Total number of matches played
  wonMatches: number    // Number of matches won
  winRate: number       // Win rate (percentage)
  level: number         // Player level
}

// Interface for component properties
interface PlayerStatsCardProps {
  stats: PlayerStats           // Player statistics
  variant?: "compact" | "full" // Display variant: compact or full
}

// Default values for statistics when data is not available
const defaultStats: PlayerStats = {
  totalMatches: 0,
  wonMatches: 0,
  winRate: 0,
  level: 1
}

// Component for displaying player statistics
export function PlayerStatsCard({ stats = defaultStats, variant = "compact" }: PlayerStatsCardProps) {
  // Ensure valid statistics by combining with default values
  const safeStats = { ...defaultStats, ...stats }

  // Compact variant - shows only level and wins
  if (variant === "compact") {
    return (
      <div className="w-full grid grid-cols-2 gap-2">
        {/* Card for level */}
        <Card className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-2xl font-bold">{safeStats.level}</div>
        </Card>
        {/* Card for wins */}
        <Card className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm text-muted-foreground">Wins</div>
          <div className="text-2xl font-bold">{safeStats.wonMatches}</div>
        </Card>
      </div>
    )
  }

  // Full variant - shows all statistics
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Card for total matches */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Total Matches</h3>
        <p className="text-3xl font-bold mt-2">{safeStats.totalMatches}</p>
      </Card>

      {/* Card for win rate */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Win Rate</h3>
        <p className="text-3xl font-bold mt-2 text-green-500">{safeStats.winRate}%</p>
      </Card>

      {/* Card for level */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Level</h3>
        <p className="text-3xl font-bold mt-2">{safeStats.level}</p>
      </Card>
    </div>
  )
} 