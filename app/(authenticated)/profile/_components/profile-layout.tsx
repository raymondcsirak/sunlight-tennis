"use client"

import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { UserIcon, CalendarIcon, TrophyIcon, SettingsIcon, BellIcon } from "lucide-react"

interface ProfileLayoutProps {
  user: User
  profile: {
    full_name?: string
    avatar_url?: string
  } | null
  children: React.ReactNode
}

const sidebarItems = [
  { label: "Find Partner", icon: UserIcon },
  { label: "Rent Court", icon: CalendarIcon },
  { label: "Training Session", icon: TrophyIcon },
  { label: "Skills", icon: UserIcon },
  { label: "Settings", icon: SettingsIcon },
  { label: "Notifications", icon: BellIcon },
]

export function ProfileLayout({ user, profile, children }: ProfileLayoutProps) {
  const currentXP = 7500
  const nextLevel = 10000
  const level = 8
  const progress = (currentXP / nextLevel) * 100

  return (
    <div className="flex min-h-[calc(100vh-4rem)] pt-16 bg-background">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-16 border-r">
        <div className="flex flex-col gap-4 p-6">
          {/* User Info */}
          <div className="flex flex-col items-center text-center pb-6 border-b">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{profile?.full_name || "Add your name"}</h2>
            <p className="text-sm text-muted-foreground">Tennis Enthusiast</p>
            
            <div className="w-full mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>XP: {currentXP}</span>
                <span>Next Level: {nextLevel}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 justify-center">
                <TrophyIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Level {level}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72 flex-1">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
} 