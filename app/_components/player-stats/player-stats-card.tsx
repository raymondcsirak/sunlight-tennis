"use client"

import { Card } from "@/components/ui/card"

// Interfata pentru datele statistice ale jucatorului
interface PlayerStats {
  totalMatches: number  // Numarul total de meciuri jucate
  wonMatches: number    // Numarul de meciuri castigate
  winRate: number       // Rata de castig (procent)
  level: number         // Nivelul jucatorului
}

// Interfata pentru proprietatile componentei
interface PlayerStatsCardProps {
  stats: PlayerStats           // Statisticile jucatorului
  variant?: "compact" | "full" // Varianta de afisare: compacta sau completa
}

// Valori implicite pentru statistici cand nu sunt disponibile date
const defaultStats: PlayerStats = {
  totalMatches: 0,
  wonMatches: 0,
  winRate: 0,
  level: 1
}

// Componenta pentru afisarea statisticilor jucatorului
export function PlayerStatsCard({ stats = defaultStats, variant = "compact" }: PlayerStatsCardProps) {
  // Asigura statistici valide prin combinarea cu valorile implicite
  const safeStats = { ...defaultStats, ...stats }

  // Varianta compacta - afiseaza doar nivelul si victoriile
  if (variant === "compact") {
    return (
      <div className="w-full grid grid-cols-2 gap-2">
        {/* Card pentru nivel */}
        <Card className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-2xl font-bold">{safeStats.level}</div>
        </Card>
        {/* Card pentru victorii */}
        <Card className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm text-muted-foreground">Wins</div>
          <div className="text-2xl font-bold">{safeStats.wonMatches}</div>
        </Card>
      </div>
    )
  }

  // Varianta completa - afiseaza toate statisticile
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Card pentru total meciuri */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Total Matches</h3>
        <p className="text-3xl font-bold mt-2">{safeStats.totalMatches}</p>
      </Card>

      {/* Card pentru rata de castig */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Win Rate</h3>
        <p className="text-3xl font-bold mt-2 text-green-500">{safeStats.winRate}%</p>
      </Card>

      {/* Card pentru nivel */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Level</h3>
        <p className="text-3xl font-bold mt-2">{safeStats.level}</p>
      </Card>
    </div>
  )
} 