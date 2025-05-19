"use client"

import { motion } from "framer-motion"
import { Trophy, Lock, Gift, Star, Sparkles, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Dados de exemplo
const rewards = [
  {
    id: 1,
    title: "Tema Matrix",
    description: "Desbloqueie o tema especial Matrix inspirado no filme",
    progress: 80,
    unlocked: false,
    xpRequired: 1000,
    icon: Sparkles,
    category: "visual",
  },
  {
    id: 2,
    title: "Modo Pomodoro+",
    description: "Configurações avançadas para o timer Pomodoro",
    progress: 100,
    unlocked: true,
    xpRequired: 500,
    icon: Zap,
    category: "feature",
  },
  {
    id: 3,
    title: "Análise Avançada",
    description: "Acesso a métricas detalhadas de produtividade",
    progress: 45,
    unlocked: false,
    xpRequired: 2000,
    icon: Star,
    category: "feature",
  },
  {
    id: 4,
    title: "Tema de Alto Contraste",
    description: "Tema especial com alto contraste para melhor visibilidade",
    progress: 60,
    unlocked: false,
    xpRequired: 1500,
    icon: Sparkles,
    category: "visual",
  },
  {
    id: 5,
    title: "Integração com GitHub",
    description: "Conecte suas tarefas diretamente com issues do GitHub",
    progress: 30,
    unlocked: false,
    xpRequired: 3000,
    icon: Gift,
    category: "integration",
  },
  {
    id: 6,
    title: "Decomposição por IA",
    description: "Use IA para decompor tarefas complexas automaticamente",
    progress: 10,
    unlocked: false,
    xpRequired: 5000,
    icon: Zap,
    category: "feature",
  },
]

export default function RewardsPage() {
  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Recompensas</h1>
        <p className="text-muted-foreground">Desbloqueie recompensas à medida que ganha XP e sobe de nível</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Nível 5</div>
              <p className="text-xs text-muted-foreground">450 / 1000 XP para o próximo nível</p>
              <Progress value={45} className="mt-2 h-2" />
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
              <CardTitle className="text-sm font-medium">Recompensas Desbloqueadas</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1 / 6</div>
              <p className="text-xs text-muted-foreground">Próxima: Tema Matrix (80% concluído)</p>
              <Progress value={16} className="mt-2 h-2" />
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
              <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7 dias</div>
              <p className="text-xs text-muted-foreground">+50 XP por dia de sequência</p>
              <Progress value={58} className="mt-2 h-2" />
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
              <CardTitle className="text-sm font-medium">Total de XP</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,450 XP</div>
              <p className="text-xs text-muted-foreground">+450 XP esta semana</p>
              <Progress value={45} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="visual">Visuais</TabsTrigger>
          <TabsTrigger value="feature">Funcionalidades</TabsTrigger>
          <TabsTrigger value="integration">Integrações</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={reward.unlocked ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${reward.unlocked ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        >
                          <reward.icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-lg">{reward.title}</CardTitle>
                      </div>
                      {reward.unlocked ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                          Desbloqueado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          <Lock className="mr-1 h-3 w-3" /> Bloqueado
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {reward.unlocked ? "Desbloqueado" : `${reward.progress}% concluído`}
                        </span>
                        <span className="text-muted-foreground">{reward.xpRequired} XP necessários</span>
                      </div>
                      <Progress value={reward.progress} className="h-2" />
                      {!reward.unlocked && (
                        <Button variant="outline" className="mt-2 w-full">
                          Ver detalhes
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="visual" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards
              .filter((reward) => reward.category === "visual")
              .map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={reward.unlocked ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${reward.unlocked ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                          >
                            <reward.icon className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-lg">{reward.title}</CardTitle>
                        </div>
                        {reward.unlocked ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                            Desbloqueado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <Lock className="mr-1 h-3 w-3" /> Bloqueado
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {reward.unlocked ? "Desbloqueado" : `${reward.progress}% concluído`}
                          </span>
                          <span className="text-muted-foreground">{reward.xpRequired} XP necessários</span>
                        </div>
                        <Progress value={reward.progress} className="h-2" />
                        {!reward.unlocked && (
                          <Button variant="outline" className="mt-2 w-full">
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="feature" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards
              .filter((reward) => reward.category === "feature")
              .map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={reward.unlocked ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${reward.unlocked ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                          >
                            <reward.icon className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-lg">{reward.title}</CardTitle>
                        </div>
                        {reward.unlocked ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                            Desbloqueado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <Lock className="mr-1 h-3 w-3" /> Bloqueado
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {reward.unlocked ? "Desbloqueado" : `${reward.progress}% concluído`}
                          </span>
                          <span className="text-muted-foreground">{reward.xpRequired} XP necessários</span>
                        </div>
                        <Progress value={reward.progress} className="h-2" />
                        {!reward.unlocked && (
                          <Button variant="outline" className="mt-2 w-full">
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="integration" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards
              .filter((reward) => reward.category === "integration")
              .map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={reward.unlocked ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${reward.unlocked ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                          >
                            <reward.icon className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-lg">{reward.title}</CardTitle>
                        </div>
                        {reward.unlocked ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                            Desbloqueado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <Lock className="mr-1 h-3 w-3" /> Bloqueado
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {reward.unlocked ? "Desbloqueado" : `${reward.progress}% concluído`}
                          </span>
                          <span className="text-muted-foreground">{reward.xpRequired} XP necessários</span>
                        </div>
                        <Progress value={reward.progress} className="h-2" />
                        {!reward.unlocked && (
                          <Button variant="outline" className="mt-2 w-full">
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
