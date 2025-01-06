"use client"

import { useCallback, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { User, Loader2, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const AVATAR_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export interface AvatarUploadProps {
  url?: string | null
  onUpload: (url: string) => Promise<void>
  size?: number
}

export function AvatarUpload({ url, onUpload, size = 150 }: AvatarUploadProps) {
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

  const handleFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      setUploading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("Authentication required")
      }

      const file = event.target.files[0]
      validateFile(file)

      // Create a unique filename with user ID
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Math.random()}.${fileExt}`

      // Delete old avatar if exists
      if (url) {
        await deleteOldAvatar(url)
      }

      // Upload new avatar
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      await onUpload(publicUrl)

      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (event.target) {
        event.target.value = ""
      }
    }
  }, [url, supabase, onUpload, toast])

  return (
    <div className="relative group">
      <div 
        style={{ width: size, height: size }}
        className="relative overflow-hidden rounded-full transition-opacity group-hover:opacity-50"
      >
        <Avatar className="h-full w-full">
          <AvatarImage 
            src={url || undefined} 
            alt="Avatar" 
            className="object-cover"
          />
          <AvatarFallback>
            <User className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <Label htmlFor="avatar" className="cursor-pointer">
          {uploading ? (
            <Loader2 className="h-12 w-12 animate-spin" />
          ) : (
            <Upload className="h-12 w-12" />
          )}
        </Label>
        <Input
          id="avatar"
          type="file"
          accept={ALLOWED_FILE_TYPES.join(",")}
          className="hidden"
          onChange={handleFileSelected}
          disabled={uploading}
        />
      </div>
    </div>
  )
}