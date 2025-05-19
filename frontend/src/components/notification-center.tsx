"use client"

import * as React from "react"
import { Bell } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
}

// Dados de exemplo
const notifications: Notification[] = [
  {
    id: "1",
    title: "Nova tarefa atribuída",
    description: "Você recebeu uma nova tarefa: Implementar autenticação",
    time: "Agora mesmo",
    read: false,
  },
  {
    id: "2",
    title: "Parabéns! Nível 5 alcançado",
    description: "Você subiu para o nível 5 e desbloqueou novas recompensas",
    time: "2 horas atrás",
    read: false,
  },
  {
    id: "3",
    title: "Lembrete: Reunião de sprint",
    description: "Sua reunião de sprint começa em 15 minutos",
    time: "15 minutos atrás",
    read: true,
  },
  {
    id: "4",
    title: "Tarefa concluída",
    description: "Você concluiu a tarefa: Corrigir bug no frontend",
    time: "Ontem",
    read: true,
  },
]

export function NotificationCenter({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [notifs, setNotifs] = React.useState<Notification[]>(notifications)

  const unreadCount = notifs.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" className="h-auto p-0 text-xs text-muted-foreground" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifs.length > 0 ? (
            <div className="flex flex-col gap-1 p-1">
              {notifs.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-md p-3 text-left text-sm transition-colors hover:bg-muted",
                    !notification.read && "bg-muted/50",
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{notification.title}</div>
                    {!notification.read && <div className="flex h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{notification.description}</div>
                  <div className="text-xs text-muted-foreground">{notification.time}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">Nenhuma notificação</div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full">
            Ver todas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
