"use client"

import { motion } from "framer-motion"
import { Clock, MoreHorizontal } from "lucide-react"
import { useReducedMotion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Task {
  id: number
  title: string
  description: string
  progress: number
  priority: "high" | "medium" | "low"
  dueTime: string
}

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const shouldReduceMotion = useReducedMotion()

  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }

  const priorityLabels = {
    high: "Alta prioridade",
    medium: "Média prioridade",
    low: "Baixa prioridade",
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="group relative rounded-md border p-4 hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
        tabIndex={0}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-md transition-colors group-hover:bg-primary group-focus-within:bg-primary">
              <div
                className={`h-full w-full rounded-l-md ${priorityColors[task.priority]}`}
                aria-label={priorityLabels[task.priority]}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{priorityLabels[task.priority]}</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex flex-col space-y-2 pl-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Opções da tarefa">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => {}}>Editar</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>Marcar como concluída</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>Adiar</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => {}}>
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{task.dueTime}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{task.progress}%</span>
            </div>
          </div>
          <Progress value={task.progress} className="h-2" aria-label={`Progresso: ${task.progress}%`} />
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
