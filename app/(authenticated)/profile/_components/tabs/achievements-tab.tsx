"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

interface AchievementsTabProps {
  userId: string
}

interface Achievement {
  id: string
  type: string
  name: string
  description: string | null
  icon: string | null
  earned_at: string
}

export function AchievementsTab({ userId }: AchievementsTabProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadAchievements() {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })

      if (error) {
        console.error("Error loading achievements:", error)
        return
      }

      setAchievements(data || [])
      setIsLoading(false)
    }

    loadAchievements()
  }, [userId, supabase])

  if (isLoading) {
    return <div>Loading achievements...</div>
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Achievements Yet</CardTitle>
          <CardDescription>
            Start playing matches and engaging with the platform to earn achievements!
          </CardDescription>
        </CardHeader>
      </Card>
    )
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
      {Object.entries(achievementsByType).map(([type, typeAchievements]) => (
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
                        Earned {new Date(achievement.earned_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 