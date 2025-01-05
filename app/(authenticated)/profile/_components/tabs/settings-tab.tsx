"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserSettings {
  email_notifications: boolean
  push_notifications: boolean
  match_reminders: boolean
  court_updates: boolean
  privacy_profile_visible: boolean
  privacy_skill_visible: boolean
  privacy_history_visible: boolean
  theme: "light" | "dark" | "system"
  language: "en" | "ro"
}

interface SettingsTabProps {
  userId: string
  initialSettings?: UserSettings
}

export function SettingsTab({ userId, initialSettings }: SettingsTabProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings || {
    email_notifications: true,
    push_notifications: true,
    match_reminders: true,
    court_updates: true,
    privacy_profile_visible: true,
    privacy_skill_visible: true,
    privacy_history_visible: true,
    theme: "system",
    language: "en",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load initial settings if not provided
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) {
        console.error("Error loading settings:", error)
        return
      }

      if (data) {
        console.log("Loaded settings:", data)
        setSettings(data)
      }
    }

    if (!initialSettings) {
      loadSettings()
    }
  }, [userId, initialSettings, supabase])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      console.log("Saving settings:", {
        user_id: userId,
        ...settings,
      })

      const { data, error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: userId,
            ...settings,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        )
        .select()

      if (error) throw error

      console.log("Save response:", data)
      
      // Update local state with the saved data
      if (data && data[0]) {
        setSettings(data[0])
      }

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "There was an error saving your settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Notification Settings */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <Switch
              id="push-notifications"
              checked={settings.push_notifications}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, push_notifications: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="match-reminders">Match Reminders</Label>
            <Switch
              id="match-reminders"
              checked={settings.match_reminders}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, match_reminders: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="court-updates">Court Updates</Label>
            <Switch
              id="court-updates"
              checked={settings.court_updates}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, court_updates: checked }))
              }
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="profile-visible">Profile Visibility</Label>
            <Switch
              id="profile-visible"
              checked={settings.privacy_profile_visible}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, privacy_profile_visible: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="skill-visible">Skill Level Visibility</Label>
            <Switch
              id="skill-visible"
              checked={settings.privacy_skill_visible}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, privacy_skill_visible: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="history-visible">Match History Visibility</Label>
            <Switch
              id="history-visible"
              checked={settings.privacy_history_visible}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, privacy_history_visible: checked }))
              }
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value: "light" | "dark" | "system") =>
                setSettings((prev) => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="language">Language</Label>
            <Select
              value={settings.language}
              onValueChange={(value: "en" | "ro") =>
                setSettings((prev) => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ro">Romanian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
} 