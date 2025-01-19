// Componenta client-side pentru header-ul aplicatiei
"use client"

// Importuri necesare pentru componentele header-ului
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { NotificationDropdown } from "./notifications/notification-dropdown"
import { ThemeSwitcher } from "@/components/theme-switcher"

// Componenta Header - afiseaza bara de navigare principala, notificari si meniul utilizatorului
export function Header() {
  return (
    // Container principal cu efect de blur pentru background
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo-ul aplicatiei cu link catre home */}
        <Link href="/" className="font-bold">SunlightTennis</Link>
        {/* Meniul principal de navigare */}
        <MainNav className="mx-6" />
        {/* Container pentru elementele din dreapta */}
        <div className="ml-auto flex items-center space-x-4">
          <NotificationDropdown />
          <ThemeSwitcher />
          <UserNav />
        </div>
      </div>
    </header>
  )
} 