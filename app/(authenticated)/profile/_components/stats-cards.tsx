"use client"

import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

interface StatsCardsProps {
  totalMatches: number
  winRate: number
  totalHours: number
}

export function StatsCards({ totalMatches, winRate, totalHours }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
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