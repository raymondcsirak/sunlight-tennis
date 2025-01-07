"use client"

import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { NotificationDropdown } from "./notifications/notification-dropdown"
import { ThemeSwitcher } from "@/components/theme-switcher"

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="font-bold">SunlightTennis</Link>
        <MainNav className="mx-6" />
        <div className="ml-auto flex items-center space-x-4">
          <NotificationDropdown />
          <ThemeSwitcher />
          <UserNav />
        </div>
      </div>
    </header>
  )
} 