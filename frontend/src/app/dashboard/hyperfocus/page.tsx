"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import { Play, Pause, SkipForward, Clock, Settings, X, Volume2, VolumeX, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function HyperfocusPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showDistraction, setShowDistraction] = useState(false)
  const [distractions, setDistractions] = useState<string[]>(["Verificar email", "Responder mensagem no Slack"])
  const [newDistraction, setNewDistraction] = useState("")
  const shouldReduceMotion = useReducedMotion()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1
          setProgress(100 - (newTime / (25 * 60)) * 100)
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      // Aqui poderia ter uma notificação ou som
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(25 * 60)
    setProgress(0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleAddDistraction = () => {
    if (!newDistraction) return
    setDistractions([...distractions, newDistraction])
    setNewDistraction("")
    setShowDistraction(false)
  }

  const handleRemoveDistraction = (index: number) => {
    const updatedDistractions = [...distractions]
    updatedDistractions.splice(index, 1)
    setDistractions(updatedDistractions)
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      {/* Substituindo o SkipLink por um link de acessibilidade simples */}
      <a
        href="#timer"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Pular para o timer
      </a>
      <a
        href="#context"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Pular para o contexto atual
      </a>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Modo Hiperfoco</h1>
        <p className="text-muted-foreground">Maximize sua produtividade com o modo hiperfoco</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          id="timer"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle>Timer Pomodoro</CardTitle>
              <CardDescription>Técnica de gerenciamento de tempo para aumentar o foco</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-primary/20">
                  <div className="absolute inset-0 rounded-full">
                    <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                      <circle className="stroke-primary/20" cx="50" cy="50" r="46" strokeWidth="8" fill="none" />
                      <circle
                        className="stroke-primary"
                        cx="50"
                        cy="50"
                        r="46"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="289.02652413026095"
                        strokeDashoffset={289.02652413026095 * (1 - progress / 100)}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-4xl font-bold"
                      aria-live="polite"
                      aria-label={`Tempo restante: ${formatTime(timeLeft)}`}
                    >
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-muted-foreground">{isRunning ? "Focando" : "Pausado"}</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Ativar som" : "Silenciar"}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant={isRunning ? "destructive" : "default"}
                    size="lg"
                    onClick={toggleTimer}
                    aria-label={isRunning ? "Pausar timer" : "Iniciar timer"}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="mr-2 h-5 w-5" aria-hidden="true" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" aria-hidden="true" /> Iniciar
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={resetTimer} aria-label="Reiniciar timer">
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Configurações do timer">
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          id="context"
        >
          <Card>
            <CardHeader>
              <CardTitle>Contexto Atual</CardTitle>
              <CardDescription>Mantenha o foco no que é importante agora</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="task">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="task">Tarefa</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                  <TabsTrigger value="distractions">Distrações</TabsTrigger>
                </TabsList>
                <TabsContent value="task" className="space-y-4 pt-4">
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Implementar autenticação</h3>
                      <Badge variant="outline">
                        <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                        14:00
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Adicionar JWT e proteção de rotas</p>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>Progresso</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" aria-label="Progresso da tarefa: 75%" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Subtarefas</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="subtask-1"
                          className="h-4 w-4 rounded border-gray-300"
                          checked
                          readOnly
                          aria-label="Configurar NextAuth.js (concluída)"
                        />
                        <label htmlFor="subtask-1" className="text-sm line-through">
                          Configurar NextAuth.js
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="subtask-2"
                          className="h-4 w-4 rounded border-gray-300"
                          checked
                          readOnly
                          aria-label="Implementar login com credenciais (concluída)"
                        />
                        <label htmlFor="subtask-2" className="text-sm line-through">
                          Implementar login com credenciais
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="subtask-3"
                          className="h-4 w-4 rounded border-gray-300"
                          aria-label="Adicionar middleware de autenticação"
                        />
                        <label htmlFor="subtask-3" className="text-sm">
                          Adicionar middleware de autenticação
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="subtask-4"
                          className="h-4 w-4 rounded border-gray-300"
                          aria-label="Testar fluxo de autenticação"
                        />
                        <label htmlFor="subtask-4" className="text-sm">
                          Testar fluxo de autenticação
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="pt-4">
                  <textarea
                    className="h-[200px] w-full rounded-md border p-2 text-sm"
                    placeholder="Adicione notas sobre o que você está trabalhando..."
                    defaultValue="- Lembrar de verificar a documentação do NextAuth.js para proteção de rotas
- Verificar se o token JWT está sendo armazenado corretamente
- Implementar refresh token"
                    aria-label="Notas sobre a tarefa atual"
                  />
                </TabsContent>
                <TabsContent value="distractions" className="space-y-4 pt-4">
                  <div className="rounded-md border p-4">
                    <h3 className="font-medium">Bloqueador de Distrações</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Registre pensamentos intrusivos para lidar com eles depois
                    </p>

                    {showDistraction ? (
                      <motion.div
                        className="mt-4 space-y-2"
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Atenção</AlertTitle>
                          <AlertDescription>Registre a distração e volte ao foco rapidamente.</AlertDescription>
                        </Alert>
                        <div className="flex">
                          <input
                            type="text"
                            placeholder="Descreva a distração..."
                            className="flex-1 rounded-l-md border px-3 py-1 text-sm"
                            value={newDistraction}
                            onChange={(e) => setNewDistraction(e.target.value)}
                            aria-label="Descreva a distração"
                          />
                          <Button className="rounded-l-none" onClick={handleAddDistraction}>
                            Registrar
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {distractions.map((distraction, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md bg-muted p-2 text-sm"
                          >
                            <span>{distraction}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveDistraction(index)}
                              aria-label={`Remover distração: ${distraction}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full" onClick={() => setShowDistraction(true)}>
                          Registrar nova distração
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Hiperfoco</CardTitle>
            <CardDescription>Acompanhe seu tempo em hiperfoco e produtividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Hoje</div>
                <div className="text-2xl font-bold">2h 15m</div>
                <div className="text-xs text-muted-foreground">+45m em relação a ontem</div>
                <Progress value={75} className="h-2" aria-label="Progresso de hoje: 75%" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Esta semana</div>
                <div className="text-2xl font-bold">14h 30m</div>
                <div className="text-xs text-muted-foreground">+2h em relação à semana passada</div>
                <Progress value={60} className="h-2" aria-label="Progresso semanal: 60%" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Sequência</div>
                <div className="text-2xl font-bold">7 dias</div>
                <div className="text-xs text-muted-foreground">Seu recorde é 12 dias</div>
                <Progress value={58} className="h-2" aria-label="Progresso da sequência: 58%" />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="rounded-md border">
              <div className="p-4">
                <h3 className="font-medium">Horários mais produtivos</h3>
                <p className="text-sm text-muted-foreground">Baseado nos seus dados históricos</p>
              </div>
              <div className="h-[200px] p-4">
                {/* Aqui seria renderizado um gráfico de produtividade */}
                <div className="flex h-full items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">Gráfico de produtividade por hora do dia</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
