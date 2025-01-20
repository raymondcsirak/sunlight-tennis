"use client"

import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EditProfileDialog } from "./edit-profile-dialog"
import { useState } from "react"

// Interfata pentru proprietatile componentei ProfileHeader
interface ProfileHeaderProps {
  user: User
  profile: {
    full_name?: string
    avatar_url?: string
  } | null
}

// Componenta principala pentru antetul profilului
export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>
            {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold truncate">
                {profile?.full_name || "Add your name"}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <EditProfileDialog user={user} profile={profile}>
              <Button variant="outline">Edit Profile</Button>
            </EditProfileDialog>
          </div>
        </div>
      </div>
    </Card>
  )
} 