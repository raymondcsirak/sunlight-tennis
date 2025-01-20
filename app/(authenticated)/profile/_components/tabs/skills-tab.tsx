"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

// Interfata pentru structura unei abilitati
interface Skill {
  skill_type: string
  level: number
}

// Interfata pentru proprietatile componentei SkillsTab
interface SkillsTabProps {
  userId: string
}

// Tipuri de abilitati si descrierile lor
type SkillType = 'Forehand' | 'Backhand' | 'Serve' | 'Volley' | 'Footwork' | 'Mental Game'

const SKILL_DESCRIPTIONS: Record<SkillType, [string, string]> = {
  'Forehand': ['Basic forehand technique', 'Tournament-level forehand'],
  'Backhand': ['Basic backhand technique', 'Tournament-level backhand'],
  'Serve': ['Basic serve technique', 'Tournament-level serve'],
  'Volley': ['Basic volley technique', 'Tournament-level volleys'],
  'Footwork': ['Basic movement patterns', 'Professional-level movement'],
  'Mental Game': ['Basic match temperament', 'Elite mental strength']
}

// Componenta principala pentru tab-ul de abilitati
export function SkillsTab({ userId }: SkillsTabProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Hook pentru incarcarea abilitatilor utilizatorului
  useEffect(() => {
    async function loadSkills() {
      const { data, error } = await supabase
        .from("player_skills")
        .select("*")
        .eq("user_id", userId)

      if (error) {
        console.error("Error loading skills:", error)
        return
      }

      // If no skills exist, create default ones
      if (!data || data.length === 0) {
        const defaultSkills: Skill[] = [
          { skill_type: 'Forehand', level: 1 },
          { skill_type: 'Backhand', level: 1 },
          { skill_type: 'Serve', level: 1 },
          { skill_type: 'Volley', level: 1 },
          { skill_type: 'Footwork', level: 1 },
          { skill_type: 'Mental Game', level: 1 }
        ]

        // Insert default skills
        const { error: insertError } = await supabase
          .from("player_skills")
          .upsert(defaultSkills.map(skill => ({
            user_id: userId,
            skill_type: skill.skill_type,
            level: skill.level,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })))

        if (insertError) {
          console.error("Error creating default skills:", insertError)
          return
        }

        setSkills(defaultSkills)
      } else {
        setSkills(data)
      }
      
      setLoading(false)
    }

    loadSkills()
  }, [userId, supabase])

  // Functie pentru actualizarea unei abilitati
  const handleSkillUpdate = async (skillType: string, level: number) => {
    const updatedSkills = skills.map(skill => 
      skill.skill_type === skillType ? { ...skill, level } : skill
    )
    setSkills(updatedSkills)
  }

  // Functie pentru salvarea abilitatilor
  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("player_skills")
        .upsert(
          skills.map(skill => ({
            user_id: userId,
            skill_type: skill.skill_type,
            level: skill.level,
            updated_at: new Date().toISOString()
          })),
          {
            onConflict: 'user_id,skill_type',
            ignoreDuplicates: false
          }
        )

      if (error) throw error

      toast({
        title: "Skills updated",
        description: "Your skill levels have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving skills:", error)
      toast({
        title: "Error",
        description: "There was an error saving your skills.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Afisare mesaj de incarcare
  if (loading) {
    return <div>Loading skills...</div>
  }

  // Date pentru graficul de abilitati
  const chartData = skills.map(skill => ({
    skill: skill.skill_type,
    value: skill.level * 20 // Convert 1-5 scale to 0-100 for the chart
  }))

  // Afisare grafic de abilitati
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
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

      <Card>
        <CardHeader>
          <CardTitle>Skill Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {skills.map((skill) => (
              <div key={skill.skill_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{skill.skill_type}</Label>
                  <span className="text-sm text-muted-foreground">Level {skill.level}/5</span>
                </div>
                <div className="space-y-1">
                  <Slider
                    value={[skill.level]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={([value]: number[]) => handleSkillUpdate(skill.skill_type, value)}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{SKILL_DESCRIPTIONS[skill.skill_type as SkillType][0]}</span>
                    <span>{SKILL_DESCRIPTIONS[skill.skill_type as SkillType][1]}</span>
                  </div>
                </div>
              </div>
            ))}
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="mt-6"
            >
              {saving ? "Saving..." : "Save Skills"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 