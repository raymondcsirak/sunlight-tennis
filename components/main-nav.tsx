"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      <Link
        href="/find-partner"
        prefetch={true}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/find-partner"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Find Partner
      </Link>
      <Link
        href="/courts"
        prefetch={true}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/courts"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Book Court
      </Link>
      <Link
        href="/training"
        prefetch={true}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/training"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Training
      </Link>
      <Link
        href="/profile/schedule"
        prefetch={true}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/profile/schedule"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Schedule
      </Link>
    </nav>
  )
} 