import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { NotificationDropdown } from "@/app/_components/notifications/notification-dropdown"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* ... search component ... */}
          </div>
          <nav className="flex items-center space-x-2">
            <NotificationDropdown />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  )
} 