"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MyMatchesTab } from "./my-matches-tab"
import { CurrentRequestsTab } from "./current-requests-tab"
import { LeaderboardTab } from "./leaderboard-tab"

interface PartnerFinderTabsProps {
  userId: string
}

export function PartnerFinderTabs({ userId }: PartnerFinderTabsProps) {
  return (
    <Tabs defaultValue="my-matches" className="space-y-4">
      <TabsList className="grid w-full max-w-[400px] grid-cols-3">
        <TabsTrigger value="my-matches">My Matches</TabsTrigger>
        <TabsTrigger value="current-requests">Open Requests</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
      </TabsList>
      <TabsContent value="my-matches" className="space-y-4">
        <MyMatchesTab userId={userId} />
      </TabsContent>
      <TabsContent value="current-requests" className="space-y-4">
        <CurrentRequestsTab userId={userId} />
      </TabsContent>
      <TabsContent value="leaderboard" className="space-y-4">
        <LeaderboardTab userId={userId} />
      </TabsContent>
    </Tabs>
  )
} 