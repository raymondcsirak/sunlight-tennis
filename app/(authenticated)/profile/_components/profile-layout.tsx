"use client"

import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { EditProfileDialog } from "./edit-profile-dialog"
import { AvatarUpload } from "./avatar-upload"
import { createBrowserClient } from "@supabase/ssr"
import { useCallback, useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon, MessageSquare, Trophy, Users, Settings, Home, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { calculateLevelProgress } from "@/utils/xp"
import { PlayerStatsCard } from "@/app/_components/player-stats/player-stats-card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Interfață pentru statistici ale jucătorului
interface PlayerStats {
  totalMatches: number
  wonMatches: number
  winRate: number
  level: number
}

// Proprietăți pentru componenta ProfileLayout
interface ProfileLayoutProps {
  children: React.ReactNode
  user: User
  profile: any
  playerXp?: {
    current_xp: number
  }
  playerStats: {
    totalMatches: number
    wonMatches: number
    winRate: number
    level: number
  }
  hideFooter?: boolean
}

// Componenta principală ProfileLayout
export function ProfileLayout({ 
  children, 
  user, 
  profile, 
  playerXp, 
  playerStats,
  hideFooter = false 
}: ProfileLayoutProps) {
  const { toast } = useToast()
  const pathname = usePathname()
  const router = useRouter()
  const [showEditProfile, setShowEditProfile] = useState(!profile?.full_name)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const menuItems = [
    {
      label: "My Profile",
      icon: Home,
      href: "/profile",
    },
    {
      label: "Find a Partner",
      icon: Users,
      href: "/profile/partner-finder",
    },
    {
      label: "Book a Court",
      icon: CalendarIcon,
      href: "/profile/courts",
    },
    {
      label: "Training Sessions",
      icon: Trophy,
      href: "/profile/training",
    },
    {
      label: "My Schedule",
      icon: CalendarIcon,
      href: "/profile/schedule",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/profile/messages",
      showNotification: hasUnreadMessages
    },
    {
      label: "Skills",
      icon: Trophy,
      href: "/profile/skills",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/profile/settings",
    },
  ]

  // Check for unread messages
  useEffect(() => {
    const checkUnreadMessages = async () => {
      const { data: threads } = await supabase
        .from('message_threads')
        .select(`
          id,
          messages!inner (
            id,
            sender_id,
            read_at
          )
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      const hasUnread = threads?.some(thread => 
        thread.messages.some(message => 
          message.sender_id !== user.id && !message.read_at
        )
      )

      setHasUnreadMessages(!!hasUnread)
    }

    checkUnreadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('message_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          checkUnreadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user.id])

  // Calculate level progress
  const progress = calculateLevelProgress(playerXp?.current_xp || 0)

  console.log("Player Stats in Layout:", playerStats)

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

  // Obține URL-ul complet al avatarului dacă există un path
  const avatarUrl = profile?.avatar_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : undefined

  console.log("Profile:", profile)
  console.log("Avatar URL:", avatarUrl)

  return (
    <div className="fixed inset-0 pt-16 bg-background">
      {/* Comentariu: Efect de strălucire subtilă în fundal */}
      <div className="absolute top-16 inset-x-0 bottom-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent h-24" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_35%_at_50%_0%,rgba(var(--primary)_/_0.03)_0%,transparent_100%)]" />
      </div>
      
      <div className="absolute inset-0 top-16 flex">
        {/* Butonul de meniu pentru mobil */}
        <div className="lg:hidden fixed top-[4.1rem] left-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <div className="border-r border-border/40 backdrop-blur-sm bg-card/50 h-full overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Secțiunea de profil care include încărcarea avatarului și detaliile utilizatorului */}
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
                      <EditProfileDialog 
                        user={user} 
                        profile={profile}
                        open={showEditProfile}
                        onOpenChange={setShowEditProfile}
                      >
                        <Button variant="outline" size="sm" className="mt-2">
                          Edit Profile
                        </Button>
                      </EditProfileDialog>
                    </div>

                    {/* Carduri cu statistici ale jucătorului */}
                    <PlayerStatsCard stats={playerStats} variant="compact" />
                  </div>

                  {/* Meniul de navigare pentru acțiuni legate de profil */}
                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative",
                          pathname === item.href 
                            ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary)_/_0.25)]" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.showNotification && (
                          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 border-r border-border/40 backdrop-blur-sm bg-card/50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Secțiunea de profil care include încărcarea avatarului și detaliile utilizatorului */}
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
                <EditProfileDialog 
                  user={user} 
                  profile={profile}
                  open={showEditProfile}
                  onOpenChange={setShowEditProfile}
                >
                  <Button variant="outline" size="sm" className="mt-2">
                    Edit Profile
                  </Button>
                </EditProfileDialog>
              </div>

              {/* Carduri cu statistici ale jucătorului */}
              <PlayerStatsCard stats={playerStats} variant="compact" />
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative",
                    pathname === item.href 
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary)_/_0.25)]" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.showNotification && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative overflow-y-auto">
          {hideFooter ? (
            // Conținut cu înălțime completă pentru mesaje
            <div className="h-full">
              {children}
            </div>
          ) : (
            // Stil de card pentru conținut normal
            <div className="container py-6 px-4 lg:px-8">
              <div className="bg-card/50 backdrop-blur-sm shadow-lg rounded-lg p-4 lg:p-6">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 