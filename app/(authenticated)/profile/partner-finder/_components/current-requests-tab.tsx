"use client"

import { Card } from "@/components/ui/card"

interface CurrentRequestsTabProps {
  userId: string
}

export function CurrentRequestsTab({ userId }: CurrentRequestsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Current Requests</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Coming soon...</p>
      </Card>
    </div>
  )
} 