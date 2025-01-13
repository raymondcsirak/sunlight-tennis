"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, RefreshCw } from "lucide-react"
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

function getTrophyUrl(path: string | null): string {
  if (!path) return ''
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${path}`
}

export function AchievementsTab({ userId }: AchievementsTabProps) {
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

  if (isLoading) {
    return <div>Loading achievements...</div>
  }

  const achievementsByType = achievements.reduce((acc, achievement) => {
    const type = achievement.type.split('_')[0] // Group by the first part of the type (e.g., 'first' from 'first_match_win')
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

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

      {achievements.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Achievements Yet</CardTitle>
            <CardDescription>
              Start playing matches and engaging with the platform to earn achievements!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        Object.entries(achievementsByType).map(([type, typeAchievements]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="capitalize">{type} Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {typeAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start space-x-4 rounded-lg border p-4"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      achievement.icon_path 
                        ? 'bg-transparent' 
                        : 'bg-primary/10'
                    }`}>
                      {achievement.icon_path && getTrophyUrl(achievement.icon_path) ? (
                        <Image
                          src={getTrophyUrl(achievement.icon_path)}
                          alt={achievement.name}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      ) : (
                        <Trophy className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium leading-none flex items-center gap-2">
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
                      <div className="pt-2">
                        <Badge variant="secondary" className="text-xs">
                          Earned {new Date(achievement.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
} 