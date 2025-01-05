"use client"

import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { EditProfileDialog } from "./edit-profile-dialog"
import { AvatarUpload } from "./avatar-upload"
import { createBrowserClient } from "@supabase/ssr"
import { useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon, MessageSquare, Trophy, Users } from "lucide-react"
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
    <div className="flex min-h-[calc(100vh-4rem)] pt-16">
      {/* Sidebar */}
      <div className="sticky top-16 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r bg-muted/40 p-6">
        <div className="flex flex-col gap-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center space-y-4">
            <AvatarUpload
              user={user}
              url={avatarUrl}
              onUpload={updateAvatar}
            />
            <div className="text-center">
              <p className="font-medium">{profile?.full_name || user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <EditProfileDialog user={user} profile={profile}>
              <Button variant="outline" size="sm" className="w-full">
                Edit Profile
              </Button>
            </EditProfileDialog>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  pathname === item.href && "bg-muted"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
} 