"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { NotificationCenter } from "@/components/notification-center"

export function DashboardHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <DashboardNav />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center">
            <span className="font-bold">TDAH Dev Helper</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <NotificationCenter>
              <Button variant="ghost" size="icon" aria-label="Notificações">
                <Bell className="h-5 w-5" />
              </Button>
            </NotificationCenter>
          </nav>
        </div>
      </div>
    </header>
  )
}
