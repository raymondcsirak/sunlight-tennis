"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, RefreshCw, ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

interface AchievementsTabProps {
  userId: string
}

interface Achievement {
  id: string
  type: string
  name: string
  description: string | null
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  icon_path: string | null
  created_at: string
}

interface PossibleAchievement {
  type: string
  name: string
  description: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  icon_path: string
  earned?: boolean
  created_at?: string
}

const ALL_ACHIEVEMENTS: PossibleAchievement[] = [
  {
    type: 'first_match_win',
    name: 'First Victory',
    description: 'Won your first match!',
    tier: 'gold' as const,
    icon_path: '/trophies/major/first-match.svg'
  },
  {
    type: 'matches_won_50',
    name: 'Match Master',
    description: 'Won 50 matches!',
    tier: 'gold' as const,
    icon_path: '/trophies/major/match-master.svg'
  },
  {
    type: 'matches_won_100',
    name: 'Match Legend',
    description: 'Won 100 matches!',
    tier: 'gold' as const,
    icon_path: '/trophies/major/match-legend.svg'
  },
  {
    type: 'streak_master_10',
    name: 'Streak Master',
    description: 'Achieved a 10-match winning streak!',
    tier: 'gold' as const,
    icon_path: '/trophies/major/streak-master.svg'
  },
  {
    type: 'court_veteran_50',
    name: 'Court Veteran',
    description: 'Booked 50 court sessions',
    tier: 'silver' as const,
    icon_path: '/trophies/major/court-veteran.svg'
  },
  {
    type: 'court_master_100',
    name: 'Court Master',
    description: 'Booked 100 court sessions',
    tier: 'gold' as const,
    icon_path: '/trophies/major/court-master.svg'
  },
  {
    type: 'training_expert_25',
    name: 'Training Expert',
    description: 'Completed 25 training sessions',
    tier: 'silver' as const,
    icon_path: '/trophies/major/training-expert.svg'
  },
  {
    type: 'training_master_50',
    name: 'Training Master',
    description: 'Completed 50 training sessions',
    tier: 'gold' as const,
    icon_path: '/trophies/major/training-master.svg'
  },
  {
    type: 'training_legend_100',
    name: 'Training Legend',
    description: 'Completed 100 training sessions',
    tier: 'gold' as const,
    icon_path: '/trophies/major/training-legend.svg'
  }
]

function getTrophyUrl(path: string | null): string {
  if (!path) return ''
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${path}`
}

export function AchievementsTab({ userId }: AchievementsTabProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadAchievements()
  }, [userId])

  async function loadAchievements() {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading achievements:", error)
      return
    }

    setAchievements(data || [])
    setIsLoading(false)
  }

  async function handleRetroactiveCheck() {
    try {
      setIsChecking(true)
      const response = await fetch('/api/achievements/retroactive', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to check achievements')
      }

      await loadAchievements() // Reload achievements after check

      toast({
        title: "Achievements Checked",
        description: "Your achievements have been retroactively checked and awarded.",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })
    } catch (error) {
      console.error('Error checking achievements:', error)
      toast({
        title: "Error",
        description: "Failed to check achievements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 400 // Adjust this value to control scroll distance
    const container = scrollContainerRef.current
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Combine all achievements with earned status
  const allAchievementsWithStatus = ALL_ACHIEVEMENTS.map(achievement => {
    const earned = achievements.find(a => a.type === achievement.type)
    return {
      ...achievement,
      earned: !!earned,
      created_at: earned?.created_at
    }
  })

  if (isLoading) {
    return <div>Loading achievements...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Achievements</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetroactiveCheck}
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Check Achievements
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => handleScroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide px-8"
              style={{ scrollBehavior: 'smooth' }}
            >
              {allAchievementsWithStatus.map((achievement) => (
                <div
                  key={achievement.type}
                  className={`flex-none w-[280px] rounded-lg border bg-card p-6 relative ${
                    !achievement.earned ? 'opacity-50' : ''
                  }`}
                >
                  {!achievement.earned && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-full ${
                      achievement.icon_path 
                        ? 'bg-transparent' 
                        : 'bg-primary/10'
                    }`}>
                      {achievement.icon_path && getTrophyUrl(achievement.icon_path) ? (
                        <Image
                          src={getTrophyUrl(achievement.icon_path)}
                          alt={achievement.name}
                          width={96}
                          height={96}
                          className="object-contain"
                        />
                      ) : (
                        <Trophy className="h-12 w-12 text-primary" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-lg flex items-center justify-center gap-2">
                        {achievement.name}
                        <Badge variant="outline" className={`text-xs ${
                          achievement.tier === 'gold' ? 'text-yellow-500 border-yellow-500/20' :
                          achievement.tier === 'silver' ? 'text-gray-400 border-gray-400/20' :
                          achievement.tier === 'bronze' ? 'text-amber-600 border-amber-600/20' :
                          'text-purple-500 border-purple-500/20'
                        }`}>
                          {achievement.tier}
                        </Badge>
                      </h4>
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      )}
                      {achievement.earned && achievement.created_at && (
                        <div className="pt-2">
                          <Badge variant="secondary" className="text-xs">
                            Earned {new Date(achievement.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => handleScroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 