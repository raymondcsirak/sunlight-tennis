// Imports for actions and statistics display component
import { getPlayerStats } from "./actions"
import { PlayerStatsCard } from "./player-stats-card"

// Interface for component properties
interface PlayerStatsWrapperProps {
  userId: string           // User ID for which to display statistics
  variant?: "compact" | "full"  // Display variant: compact or full
}

// Server component for loading and displaying player statistics
export async function PlayerStatsWrapper({ userId, variant }: PlayerStatsWrapperProps) {
  // Get player statistics using server action
  const stats = await getPlayerStats(userId)
  // Render display component with obtained statistics
  return <PlayerStatsCard stats={stats} variant={variant} />
} 