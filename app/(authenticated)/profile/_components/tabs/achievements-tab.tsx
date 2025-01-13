"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AchievementsTabProps {
  userId: string
}

interface Achievement {
  id: string
  type: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
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
  }, [userId, supabase])

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
    const type = achievement.type
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
              <CardTitle className="capitalize">{type.toLowerCase()} Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {typeAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start space-x-4 rounded-lg border p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium leading-none">
                        {achievement.name}
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