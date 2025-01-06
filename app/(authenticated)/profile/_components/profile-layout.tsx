"use client"

import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { EditProfileDialog } from "./edit-profile-dialog"
import { AvatarUpload } from "./avatar-upload"
import { createBrowserClient } from "@supabase/ssr"
import { useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon, MessageSquare, Trophy, Users, Settings, Home } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ProfileLayoutProps {
  user: User
  profile: any
  children: React.ReactNode
}

const menuItems = [
  {
    label: "My Profile",
    icon: Home,
    href: "/profile",
  },
  {
    label: "Find Partner",
    icon: Users,
    href: "/find-partner",
  },
  {
    label: "Rent Court",
    icon: CalendarIcon,
    href: "/rent-court",
  },
  {
    label: "Training Session",
    icon: Trophy,
    href: "/training",
  },
  {
    label: "Messages",
    icon: MessageSquare,
    href: "/messages",
  },
  {
    label: "Skills",
    icon: Trophy,
    href: "/skills",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function ProfileLayout({ user, profile, children }: ProfileLayoutProps) {
  const { toast } = useToast()
  const pathname = usePathname()
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const updateAvatar = useCallback(async (url: string) => {
    try {
      console.log("Received URL:", url)
      // Extract the path from the signed URL if it exists
      let avatar_url = url
      if (url) {
        const urlObj = new URL(url)
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/)
        if (pathMatch) {
          avatar_url = pathMatch[1]
        }
      }
      console.log("Storing avatar_url:", avatar_url)

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: avatar_url,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Refresh the page to show updated avatar
      router.refresh()
    } catch (error) {
      console.error("Error updating avatar:", error)
      toast({
        title: "Error",
        description: "There was an error updating your avatar.",
        variant: "destructive",
      })
    }
  }, [user.id, supabase, toast, router])

  // Get the full avatar URL if we have a path
  const avatarUrl = profile?.avatar_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : undefined

  console.log("Profile:", profile)
  console.log("Avatar URL:", avatarUrl)

  return (
    <div className="min-h-screen bg-background relative pt-16">
      {/* Subtle gradient glow effect */}
      <div className="fixed top-16 inset-x-0 bottom-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent h-24" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_35%_at_50%_0%,rgba(var(--primary)_/_0.03)_0%,transparent_100%)]" />
      </div>
      
      <div className="relative flex">
        {/* Left Sidebar */}
        <div className="w-64 min-h-[calc(100vh-4rem)] border-r border-border/40 backdrop-blur-sm bg-card/50">
          <div className="sticky top-16 p-6 space-y-6">
            {/* Profile Section */}
            <div className="flex flex-col items-center space-y-4">
              <AvatarUpload
                url={avatarUrl}
                onUpload={updateAvatar}
                size={150}
              />
              <div className="text-center space-y-1.5">
                <h2 className="font-semibold">{profile?.full_name || 'Anonymous Player'}</h2>
                <p className="text-sm text-muted-foreground">{profile?.username || 'No username set'}</p>
                {profile?.phone && (
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                )}
                <EditProfileDialog user={user} profile={profile}>
                  <Button variant="outline" size="sm" className="mt-2">
                    Edit Profile
                  </Button>
                </EditProfileDialog>
              </div>
              
              {/* Stats Cards */}
              <div className="w-full grid grid-cols-3 gap-2">
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="text-sm text-muted-foreground">Level</div>
                  <div className="text-2xl font-bold">{profile?.level || 1}</div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="text-sm text-muted-foreground">XP</div>
                  <div className="text-2xl font-bold">{profile?.xp || 0}</div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="text-sm text-muted-foreground">Matches</div>
                  <div className="text-2xl font-bold">{profile?.matches_played || 0}</div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname === item.href 
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary)_/_0.25)]" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="container py-6 px-8">
            <div className="bg-card/50 backdrop-blur-sm shadow-lg rounded-lg p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 