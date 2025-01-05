"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface SettingsTabProps {
  userId: string
  initialSettings?: {
    email_notifications: boolean
    push_notifications: boolean
    match_reminders: boolean
    court_updates: boolean
  }
}

export function SettingsTab({ userId, initialSettings }: SettingsTabProps) {
  const [settings, setSettings] = useState(initialSettings || {
    email_notifications: true,
    push_notifications: true,
    match_reminders: true,
    court_updates: true,
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: userId,
          settings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
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
    <div className="space-y-6">
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
      <Button onClick={handleSaveSettings} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
} 