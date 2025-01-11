import { getPlayerStats } from "./actions"
import { PlayerStatsCard } from "./player-stats-card"

interface PlayerStatsWrapperProps {
  userId: string
  variant?: "compact" | "full"
}

export async function PlayerStatsWrapper({ userId, variant }: PlayerStatsWrapperProps) {
  const stats = await getPlayerStats(userId)
  return <PlayerStatsCard stats={stats} variant={variant} />
} 