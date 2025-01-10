"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchResponse {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  responder: {
    id: string
    full_name: string
    avatar_url: string | null
    level: number
    matches_won: number
  }
}

interface MatchResponsesProps {
  responses: MatchResponse[]
  onAccept: (responseId: string) => void
  onReject: (responseId: string) => void
}

export function MatchResponses({ responses, onAccept, onReject }: MatchResponsesProps) {
  if (responses.length === 0) {
    return null
  }

  // Group responses by status
  const acceptedResponses = responses.filter(r => r.status === 'accepted')
  const pendingResponses = responses.filter(r => r.status === 'pending')
  const rejectedResponses = responses.filter(r => r.status === 'rejected')

  return (
    <div className="space-y-6">
      {acceptedResponses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-500">Accepted</h3>
          <div className="grid grid-cols-1 gap-3">
            {acceptedResponses.map((response) => (
              <ResponseCard
                key={response.id}
                response={response}
                onAccept={onAccept}
                onReject={onReject}
              />
            ))}
          </div>
        </div>
      )}

      {pendingResponses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-primary">Pending Responses</h3>
          <div className="grid grid-cols-1 gap-3">
            {pendingResponses.map((response) => (
              <ResponseCard
                key={response.id}
                response={response}
                onAccept={onAccept}
                onReject={onReject}
              />
            ))}
          </div>
        </div>
      )}

      {rejectedResponses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Rejected</h3>
          <div className="grid grid-cols-1 gap-3">
            {rejectedResponses.map((response) => (
              <ResponseCard
                key={response.id}
                response={response}
                onAccept={onAccept}
                onReject={onReject}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResponseCard({ response, onAccept, onReject }: { 
  response: MatchResponse
  onAccept: (responseId: string) => void
  onReject: (responseId: string) => void 
}) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-colors",
        response.status === 'pending' && "border-primary/50 bg-primary/5",
        response.status === 'accepted' && "border-green-500/50 bg-green-500/5",
        response.status === 'rejected' && "border-muted bg-muted/5"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={response.responder.avatar_url || undefined} />
            <AvatarFallback>
              {response.responder.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate">
                {response.responder.full_name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                Level {response.responder.level}
              </Badge>
              <div className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                <span>{response.responder.matches_won} wins</span>
              </div>
            </div>
          </div>
        </div>

        {response.status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700" 
              onClick={() => onAccept(response.id)}
            >
              Accept Request
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => onReject(response.id)}
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 