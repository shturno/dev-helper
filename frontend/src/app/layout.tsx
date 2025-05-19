import type React from "react"
import type { Metadata } from "next"
import { Mona_Sans as FontSans } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import "@/styles/globals.css"

// Import SessionProvider directly in the layout
import { SessionProvider } from "next-auth/react"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

// Create a client component wrapper for SessionProvider
function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

export const metadata: Metadata = {
  title: "TDAH Dev Helper",
  description: "Ajudando desenvolvedores com TDAH a aumentar sua produtividade",
  keywords: ["TDAH", "ADHD", "produtividade", "desenvolvimento", "hiperfoco", "gamificação", "acessibilidade"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ClientAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Suspense>{children}</Suspense>
            <Toaster />
          </ThemeProvider>
        </ClientAuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
