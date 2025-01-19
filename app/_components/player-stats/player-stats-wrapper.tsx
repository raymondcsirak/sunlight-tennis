// Importuri pentru actiuni si componenta de afisare a statisticilor
import { getPlayerStats } from "./actions"
import { PlayerStatsCard } from "./player-stats-card"

// Interfata pentru proprietatile componentei
interface PlayerStatsWrapperProps {
  userId: string           // ID-ul utilizatorului pentru care se afiseaza statisticile
  variant?: "compact" | "full"  // Varianta de afisare: compacta sau completa
}

// Componenta server pentru incarcarea si afisarea statisticilor jucatorului
export async function PlayerStatsWrapper({ userId, variant }: PlayerStatsWrapperProps) {
  // Obtine statisticile jucatorului folosind server action
  const stats = await getPlayerStats(userId)
  // Randeaza componenta de afisare cu statisticile obtinute
  return <PlayerStatsCard stats={stats} variant={variant} />
} 