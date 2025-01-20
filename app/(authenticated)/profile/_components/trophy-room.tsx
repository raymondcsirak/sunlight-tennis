"use client"

// Importă componentele necesare
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Medal, Star, Award, Crown } from "lucide-react"
import { format } from "date-fns"

// Interfață pentru realizări
interface Achievement {
  id: string
  type: string
  title: string
  earnedAt: string
}

// Interfață pentru proprietățile TrophyRoom
interface TrophyRoomProps {
  achievements: Achievement[]
}

// Mapare a tipurilor de realizări la reprezentarea lor vizuală
const ACHIEVEMENT_ICONS: Record<string, {
  icon: React.ReactNode
  color: string
  isMajor: boolean
}> = {
  first_match: {
    icon: <Trophy className="h-8 w-8" />,
    color: "text-yellow-500",
    isMajor: true
  },
  streak_7: {
    icon: <Medal className="h-8 w-8" />,
    color: "text-blue-500",
    isMajor: false
  },
  matches_10: {
    icon: <Star className="h-8 w-8" />,
    color: "text-purple-500",
    isMajor: false
  },
  level_10: {
    icon: <Crown className="h-8 w-8" />,
    color: "text-amber-500",
    isMajor: true
  }
}

// Componenta TrophyRoom care afișează realizările utilizatorului
export function TrophyRoom({ achievements }: TrophyRoomProps) {
  if (!achievements?.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Trophy className="mx-auto h-12 w-12 mb-2 opacity-20" />
          <p>No achievements yet. Keep playing to earn trophies!</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <Trophy className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <ScrollArea className="h-[280px] pr-4">
        <div className="space-y-4">
          {achievements.map((achievement) => {
            const achievementConfig = ACHIEVEMENT_ICONS[achievement.type] || {
              icon: <Award className="h-8 w-8" />,
              color: "text-gray-500",
              isMajor: false
            }

            return (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className={`${achievementConfig.color} ${achievementConfig.isMajor ? "scale-110" : ""}`}>
                  {achievementConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{achievement.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Earned {format(new Date(achievement.earnedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
} 