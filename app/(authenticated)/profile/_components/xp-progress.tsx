"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface XPProgressProps {
  level: number
  currentXp: number
  xpForNextLevel: number
  streak: number
}

export function XPProgress({ level, currentXp, xpForNextLevel, streak }: XPProgressProps) {
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showXpGain, setShowXpGain] = useState(false)
  const [prevXp, setPrevXp] = useState(currentXp)
  const [xpGained, setXpGained] = useState(0)
  const [prevStreak, setPrevStreak] = useState(streak)
  const [showStreakAnimation, setShowStreakAnimation] = useState(false)

  useEffect(() => {
    if (currentXp > prevXp) {
      setXpGained(currentXp - prevXp)
      setShowXpGain(true)
      setTimeout(() => setShowXpGain(false), 2000)
    }
    setPrevXp(currentXp)
  }, [currentXp, prevXp])

  useEffect(() => {
    if (streak > prevStreak) {
      setShowStreakAnimation(true)
      setTimeout(() => setShowStreakAnimation(false), 2000)
    }
    setPrevStreak(streak)
  }, [streak, prevStreak])

  // Calculate progress percentage
  const progress = Math.min(Math.floor((currentXp / xpForNextLevel) * 100), 100)

  return (
    <div className="space-y-6">
      {/* Level Block */}
      <div className="relative">
        <Card className="p-6 bg-gradient-to-br from-background to-muted/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Current Level</h2>
              <div className="flex items-baseline gap-2">
                <h1 className="text-4xl font-bold">Level {level}</h1>
              </div>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>XP Progress</span>
              <span>{currentXp}/{xpForNextLevel}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {xpForNextLevel - currentXp} XP needed for next level
            </p>
          </div>
        </Card>

        {/* XP Gain Animation */}
        <AnimatePresence>
          {showXpGain && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: -40 }}
              className="absolute top-0 right-24 text-primary font-bold"
            >
              +{xpGained} XP
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Up Animation */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg shadow-lg">
                Level Up! 🎉
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Streak */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Current Streak</h2>
            <p className="text-2xl font-bold">{streak} Days</p>
          </div>
          <motion.div
            className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center"
            animate={showStreakAnimation ? {
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <Flame className="h-6 w-6 text-orange-500" />
          </motion.div>
        </div>
      </Card>
    </div>
  )
} 