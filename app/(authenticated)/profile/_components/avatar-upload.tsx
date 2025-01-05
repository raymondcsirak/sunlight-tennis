"use client"

import { useCallback, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

const AVATAR_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"]

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

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error("File type not supported. Please upload a JPEG, PNG, or WebP image.")
    }

    if (file.size > AVATAR_MAX_SIZE) {
      throw new Error("File too large. Maximum size is 2MB.")
    }
  }

  const deleteOldAvatar = async (oldUrl: string) => {
    if (!oldUrl) return

    try {
      // Extract the path from the URL
      const pathMatch = oldUrl.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/)
      if (pathMatch) {
        const filePath = pathMatch[1]
        console.log("Deleting old avatar:", filePath)
        await supabase.storage.from("avatars").remove([filePath])
      }
    } catch (error) {
      console.error("Error deleting old avatar:", error)
    }
  }

  const uploadAvatar = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setUploading(true)

        if (!event.target.files || event.target.files.length === 0) {
          throw new Error("You must select an image to upload.")
        }

        const file = event.target.files[0]
        validateFile(file)

        // Create a folder structure: avatars/user_id/filename
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        console.log("Uploading to path:", filePath)

        // Delete old avatar if exists
        if (url) {
          await deleteOldAvatar(url)
        }

        // Upload new avatar
        const { error: uploadError, data } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        if (!data) {
          throw new Error("Upload failed - no data returned")
        }

        console.log("Upload successful:", data)

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        console.log("Generated public URL:", publicUrl)

        onUpload(publicUrl)

        toast({
          title: "Avatar updated",
          description: "Your avatar has been updated successfully.",
        })
      } catch (error) {
        console.error("Upload error:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "There was an error uploading your avatar.",
          variant: "destructive",
        })
      } finally {
        setUploading(false)
        // Reset the file input
        if (event.target) {
          event.target.value = ""
        }
      }
    },
    [user.id, supabase, onUpload, toast, url]
  )

  console.log("Avatar component URL:", url)

  const handleRemoveAvatar = async () => {
    try {
      setUploading(true)
      if (url) {
        await deleteOldAvatar(url)
      }
      onUpload("")
      toast({
        title: "Avatar removed",
        description: "Your avatar has been removed successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error removing your avatar.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage 
          src={url} 
          alt={user.email || ""} 
          className="object-cover"
        />
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
            onClick={handleRemoveAvatar}
          >
            Remove
          </Button>
        )}
      </div>
      <input
        id="avatar"
        type="file"
        accept={ALLOWED_FILE_TYPES.join(",")}
        onChange={uploadAvatar}
        className="hidden"
      />
    </div>
  )
} 