"use client"

import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Medal, Award, Trophy, Star } from "lucide-react"

interface Achievement {
  id: string
  type: 'first_win' | '10_match_streak' | 'tournament_win' | 'skills_master'
  title: string
  earnedAt: string
}

interface TrophyRoomProps {
  achievements: Achievement[]
}

const achievementIcons = {
  first_win: Medal,
  '10_match_streak': Award,
  tournament_win: Trophy,
  skills_master: Star,
}

const achievementColors = {
  first_win: "text-yellow-500",
  '10_match_streak': "text-blue-500",
  tournament_win: "text-green-500",
  skills_master: "text-purple-500",
}

const achievementBgColors = {
  first_win: "bg-yellow-500/20",
  '10_match_streak': "bg-blue-500/20",
  tournament_win: "bg-green-500/20",
  skills_master: "bg-purple-500/20",
}

export function TrophyRoom({ achievements }: TrophyRoomProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-xl font-semibold">Trophy Room</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((achievement, index) => {
          const Icon = achievementIcons[achievement.type]
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border"
            >
              <div className={`p-3 rounded-full ${achievementBgColors[achievement.type]}`}>
                <Icon className={`h-6 w-6 ${achievementColors[achievement.type]}`} />
              </div>
              <h3 className="font-medium text-center">{achievement.title}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(achievement.earnedAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
} 