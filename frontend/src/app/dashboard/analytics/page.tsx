"use client"

import { motion } from "framer-motion"
import { BarChart, LineChart, Calendar, Clock, ArrowUpDown, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
        <p className="text-muted-foreground">
          Visualize métricas e relatórios sobre sua produtividade
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Calendar className="mr-2 h-4 w-4" />
                Últimos 7 dias
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Hoje</DropdownMenuItem>
              <DropdownMenuItem>Últimos 7 dias</DropdownMenuItem>
              <DropdownMenuItem>Últimos 30 dias</DropdownMenuItem>
              <DropdownMenuItem>Este mês</DropdownMenuItem>
              <DropdownMenuItem>Personalizado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
        <Button size="sm" className="h-9">
          Exportar Relatório
        </Button>
      </div>

      <Tabs defaultValue="productivity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="focus">Tempo em Foco</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
        </TabsList>
        <TabsContent value="productivity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +4 em relação à semana anterior
                  </p>
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
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">14.5h</div>
                  <p className="text-xs text-muted-foreground">
                    +2.5h em relação à semana anterior
                  </p>
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
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">
                    +10% em relação à semana anterior
                  </p>
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
                  <CardTitle className="text-sm font-medium">XP Ganho</CardTitle>
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">450</div>
                  <p className="text-xs text-muted-foreground">
                    +150 em relação à semana anterior
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Produtividade ao Longo do Tempo</CardTitle>
                <CardDescription>
                  Visualize sua produtividade nos últimos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="flex h-full items-center justify-center rounded-md border border-dashed">
                  <div className="flex flex-col items-center gap-2">
                    <LineChart className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Gráfico de produtividade ao longo do tempo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Horários Mais Produtivos</CardTitle>
                  <CardDescription>
                    Análise dos seus horários mais produtivos
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Gráfico de produtividade por hora do dia
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Tarefas</CardTitle>
                  <CardDescription>
                    Distribuição de tarefas por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Gráfico de distribuição de tarefas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div> {/* fecha grid de cards menores */}
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          {/* Conteúdo da aba Tarefas */}
          <div className="flex items-center justify-center h-40 text-muted-foreground">Em breve: Relatórios de tarefas</div>
        </TabsContent>
        <TabsContent value="focus" className="space-y-4">
          {/* Conteúdo da aba Tempo em Foco */}
          <div className="flex items-center justify-center h-40 text-muted-foreground">Em breve: Relatórios de foco</div>
        </TabsContent>
        <TabsContent value="progress" className="space-y-4">
          {/* Conteúdo da aba Progresso */}
          <div className="flex items-center justify-center h-40 text-muted-foreground">Em breve: Relatórios de progresso</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
