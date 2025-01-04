"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"

export default function HeaderAuth({
  email,
}: {
  email: string | undefined
}) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")

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
      <form action="/auth/sign-out" method="post">
        <Button variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  )
}
