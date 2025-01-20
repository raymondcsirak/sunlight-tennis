"use client"

// Importă componentele necesare
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

// Interfață pentru proprietățile StatsCards
interface StatsCardsProps {
  totalMatches: number
  winRate: number
  totalHours: number
}

// Componenta StatsCards care afișează carduri cu statistici
export function StatsCards({ totalMatches, winRate, totalHours }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Card pentru Total Matches */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Total Matches</h3>
          <p className="text-3xl font-bold mt-2">{totalMatches}</p>
        </Card>
      </motion.div>

      {/* Card pentru Win Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Win Rate</h3>
          <p className="text-3xl font-bold mt-2 text-green-500">{winRate}%</p>
        </Card>
      </motion.div>

      {/* Card pentru Total Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Total Hours</h3>
          <p className="text-3xl font-bold mt-2">{totalHours}</p>
        </Card>
      </motion.div>
    </div>
  )
} 