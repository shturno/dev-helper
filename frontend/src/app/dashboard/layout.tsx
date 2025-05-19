import type React from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ThemeToggle } from "@/components/theme-toggle"
import { AccessibilityMenu } from "@/components/accessibility-menu"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Substituindo o SkipLink por um link de acessibilidade simples */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Pular para o conteúdo principal
      </a>

      <DashboardHeader />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto md:sticky md:block">
          <DashboardNav />
        </aside>
        <main id="main-content" className="flex w-full flex-col overflow-hidden">
          {children}
        </main>
      </div>
      <div className="fixed bottom-4 right-4 flex items-center gap-2">
        <AccessibilityMenu />
        <ThemeToggle />
      </div>
    </div>
  )
}
