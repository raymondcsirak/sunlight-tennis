"use client"

import { useCallback, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AvatarUploadProps {
  user: User
  url?: string
  onUpload: (url: string) => void
}

export function AvatarUpload({ user, url, onUpload }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uploadAvatar = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setUploading(true)

        if (!event.target.files || event.target.files.length === 0) {
          throw new Error("You must select an image to upload.")
        }

        const file = event.target.files[0]
        const fileExt = file.name.split(".").pop()
        const filePath = `${user.id}-${Math.random()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        onUpload(publicUrl)

        toast({
          title: "Avatar updated",
          description: "Your avatar has been updated successfully.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "There was an error uploading your avatar.",
          variant: "destructive",
        })
      } finally {
        setUploading(false)
      }
    },
    [user.id, supabase, onUpload, toast]
  )

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={url} alt={user.email || ""} />
        <AvatarFallback>
          {user.email?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById("avatar")?.click()}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        {url && (
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => onUpload("")}
          >
            Remove
          </Button>
        )}
      </div>
      <input
        id="avatar"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        className="hidden"
      />
    </div>
  )
} 