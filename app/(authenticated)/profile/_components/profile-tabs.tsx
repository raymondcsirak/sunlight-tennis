"use client"

// Importă componentele necesare pentru tab-uri
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkillsTab } from "./tabs/skills-tab"
import { MatchesTab } from "./tabs/matches-tab"
import { AchievementsTab } from "./tabs/achievements-tab"
import { SettingsTab } from "./tabs/settings-tab"

// Interfață pentru proprietățile ProfileTabs
interface ProfileTabsProps {
  userId: string
}

// Componenta ProfileTabs care gestionează tab-urile profilului
export function ProfileTabs({ userId }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="skills" className="space-y-4">
      {/* Lista de tab-uri */}
      <TabsList>
        <TabsTrigger value="skills">Skills</TabsTrigger>
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      {/* Conținutul pentru fiecare tab */}
      <TabsContent value="skills" className="space-y-4">
        <SkillsTab userId={userId} />
      </TabsContent>
      <TabsContent value="matches" className="space-y-4">
        <MatchesTab userId={userId} />
      </TabsContent>
      <TabsContent value="achievements" className="space-y-4">
        <AchievementsTab userId={userId} />
      </TabsContent>
      <TabsContent value="settings" className="space-y-4">
        <SettingsTab userId={userId} />
      </TabsContent>
    </Tabs>
  )
} 