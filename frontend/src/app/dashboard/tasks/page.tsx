"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import { Plus, Filter, Search, Calendar, Clock, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "@/components/tasks/task-card"
import { MicrotaskDecomposer } from "@/components/microtasks/microtask-decomposer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Dados de exemplo
const tasks = {
  today: [
    {
      id: 1,
      title: "Implementar autenticação",
      description: "Adicionar JWT e proteção de rotas",
      progress: 75,
      priority: "high",
      dueTime: "14:00",
    },
    {
      id: 2,
      title: "Corrigir bug no frontend",
      description: "Resolver problema de layout em telas pequenas",
      progress: 30,
      priority: "medium",
      dueTime: "16:30",
    },
    {
      id: 3,
      title: "Reunião de sprint",
      description: "Discutir progresso e próximos passos",
      progress: 0,
      priority: "low",
      dueTime: "11:00",
    },
  ],
  upcoming: [
    {
      id: 4,
      title: "Documentar API",
      description: "Atualizar documentação da API REST",
      progress: 0,
      priority: "medium",
      dueTime: "Amanhã",
    },
    {
      id: 5,
      title: "Testes de integração",
      description: "Escrever testes para novos endpoints",
      progress: 0,
      priority: "high",
      dueTime: "Quinta",
    },
    {
      id: 6,
      title: "Code review",
      description: "Revisar PRs pendentes",
      progress: 0,
      priority: "medium",
      dueTime: "Sexta",
    },
  ],
  completed: [
    {
      id: 7,
      title: "Setup do projeto",
      description: "Configurar Next.js com TypeScript",
      progress: 100,
      priority: "high",
      dueTime: "Ontem",
    },
    {
      id: 8,
      title: "Implementar UI base",
      description: "Configurar shadcn/ui e componentes base",
      progress: 100,
      priority: "medium",
      dueTime: "Ontem",
    },
  ],
}

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showDecomposer, setShowDecomposer] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="flex flex-col gap-8 py-8">
      {/* Substituindo o SkipLink por um link de acessibilidade simples */}
      <a
        href="#task-list"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Pular para a lista de tarefas
      </a>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
        <p className="text-muted-foreground">Gerencie suas tarefas e microtarefas</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
            aria-label="Buscar tarefas"
          />
          <Button size="sm" variant="ghost" className="h-9 px-2 lg:px-3" aria-label="Buscar">
            <Search className="h-4 w-4" />
            <span className="sr-only">Buscar</span>
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Data</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Prazo</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArrowUpDown className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Prioridade</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-9" onClick={() => setShowDecomposer(!showDecomposer)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {showDecomposer ? "Ocultar decompositor" : "Nova Tarefa"}
          </Button>
        </div>
      </div>

      {showDecomposer && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MicrotaskDecomposer />
        </motion.div>
      )}

      <Tabs defaultValue="today" className="space-y-4" id="task-list">
        <TabsList>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="space-y-4">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Tarefas para hoje</CardTitle>
                <CardDescription>Gerencie suas tarefas para o dia atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.today.map((task, index) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Adicionar tarefa
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-4">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Próximas tarefas</CardTitle>
                <CardDescription>Visualize e planeje suas tarefas futuras</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.upcoming.map((task, index) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Adicionar tarefa
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Tarefas concluídas</CardTitle>
                <CardDescription>Histórico de tarefas concluídas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.completed.map((task, index) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
