"use client"

import React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, Zap, Trophy, BarChart, Settings, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    shortcut: "Alt+1",
  },
  {
    title: "Tarefas",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    shortcut: "Alt+2",
  },
  {
    title: "Hiperfoco",
    href: "/dashboard/hyperfocus",
    icon: Zap,
    shortcut: "Alt+3",
  },
  {
    title: "Recompensas",
    href: "/dashboard/rewards",
    icon: Trophy,
    shortcut: "Alt+4",
  },
  {
    title: "Análises",
    href: "/dashboard/analytics",
    icon: BarChart,
    shortcut: "Alt+5",
  },
  {
    title: "Perfil",
    href: "/dashboard/profile",
    icon: User,
    shortcut: "Alt+6",
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
    shortcut: "Alt+7",
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  // Adicionar suporte a atalhos de teclado
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const index = Number.parseInt(e.key, 10)
        if (index >= 1 && index <= navItems.length) {
          e.preventDefault()
          window.location.href = navItems[index - 1].href
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <TooltipProvider>
      <nav className="grid items-start gap-2 py-4" aria-label="Navegação principal">
        {navItems.map((item) => (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link href={item.href} aria-label={item.title} aria-current={pathname === item.href ? "page" : undefined}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {item.title}
                </Button>
              </Link>
            </TooltipTrigger>
            {item.shortcut && (
              <TooltipContent side="right">
                <p>Atalho: {item.shortcut}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  )
}
