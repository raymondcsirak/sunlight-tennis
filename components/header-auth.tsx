"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"

export default function HeaderAuth({
  email,
}: {
  email: string | undefined
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (isAuthPage) {
    return null
  }

  if (!email) {
    return (
      <Button variant="outline" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" asChild>
        <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
          {email}
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  )
}
