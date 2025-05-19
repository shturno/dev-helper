"use client"

import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { Clock, Zap, Trophy, Calendar } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { XPIndicator } from "@/components/gamification/xp-indicator"
import { LevelProgress } from "@/components/gamification/level-progress"
import { RewardCard } from "@/components/gamification/reward-card"

// Simulação de dados
const fetchDashboardData = async () => {
  // Em produção, isso seria uma chamada API real
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    user: {
      name: "João Silva",
      level: 5,
      xp: 450,
      xpToNextLevel: 1000,
      streak: 7,
    },
    tasks: {
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
      ],
    },
    stats: {
      tasksCompleted: 12,
      focusTime: 14.5, // horas
      streak: 7, // dias
      nextReward: "Tema Matrix",
    },
    rewards: [
      { id: 1, title: "Tema Matrix", description: "Desbloqueie o tema especial Matrix", progress: 80, unlocked: false },
      {
        id: 2,
        title: "Modo Pomodoro+",
        description: "Configurações avançadas para o timer Pomodoro",
        progress: 100,
        unlocked: true,
      },
      {
        id: 3,
        title: "Análise Avançada",
        description: "Acesso a métricas detalhadas de produtividade",
        progress: 45,
        unlocked: false,
      },
    ],
  }
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Carregando...</h2>
          <p className="text-muted-foreground">Preparando seu dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo de volta, {data.user.name}! Aqui está seu progresso.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.tasksCompleted}</div>
              <p className="text-xs text-muted-foreground">+4 desde ontem</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo em Foco</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.focusTime}h</div>
              <p className="text-xs text-muted-foreground">+2.5h desde ontem</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sequência</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.streak} dias</div>
              <p className="text-xs text-muted-foreground">+1 desde ontem</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Recompensa</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.nextReward}</div>
              <p className="text-xs text-muted-foreground">80% concluído</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
            <CardDescription>Gerencie suas tarefas para hoje e próximos dias</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="space-y-4">
              <TabsList>
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="space-y-4">
                {data.tasks.today.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                <Button variant="outline" className="w-full">
                  <span className="sr-only">Adicionar tarefa</span>
                  <span>Adicionar tarefa</span>
                </Button>
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-4">
                {data.tasks.upcoming.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
            <CardDescription>Seu nível e recompensas desbloqueadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Nível {data.user.level}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.user.xp} / {data.user.xpToNextLevel} XP
                  </p>
                </div>
                <XPIndicator xp={data.user.xp} />
              </div>
              <LevelProgress level={data.user.level} xp={data.user.xp} xpToNextLevel={data.user.xpToNextLevel} />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Recompensas</h3>
              <div className="space-y-3">
                {data.rewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
