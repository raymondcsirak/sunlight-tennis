"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const skillsData = [
  { skill: "Forehand", value: 80 },
  { skill: "Backhand", value: 75 },
  { skill: "Serve", value: 70 },
  { skill: "Volley", value: 65 },
  { skill: "Footwork", value: 85 },
  { skill: "Mental", value: 75 },
]

interface SkillsTabProps {
  userId: string
}

export function SkillsTab({ userId }: SkillsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 