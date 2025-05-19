"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import { Sparkles, Plus, X, Check, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export function MicrotaskDecomposer() {
  const shouldReduceMotion = useReducedMotion()
  const { toast } = useToast()
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [isDecomposing, setIsDecomposing] = useState(false)
  const [microtasks, setMicrotasks] = useState<string[]>([])
  const [newMicrotask, setNewMicrotask] = useState("")

  const handleDecompose = async () => {
    if (!taskTitle) {
      toast({
        title: "Título da tarefa é obrigatório",
        description: "Por favor, informe um título para a tarefa.",
        variant: "destructive",
      })
      return
    }

    setIsDecomposing(true)

    // Simulação de decomposição automática
    // Em produção, isso seria uma chamada à API OpenAI
    setTimeout(() => {
      const generatedTasks = [
        "Configurar ambiente de desenvolvimento (15min)",
        "Criar estrutura básica do componente (15min)",
        "Implementar lógica principal (15min)",
        "Adicionar estilos e responsividade (15min)",
        "Escrever testes unitários (15min)",
        "Revisar código e corrigir problemas (15min)",
      ]

      setMicrotasks(generatedTasks)
      setIsDecomposing(false)

      toast({
        title: "Tarefa decomposta com sucesso",
        description: "Sua tarefa foi dividida em 6 microtarefas de 15 minutos.",
      })
    }, 2000)
  }

  const handleAddMicrotask = () => {
    if (!newMicrotask) return

    setMicrotasks([...microtasks, newMicrotask])
    setNewMicrotask("")
  }

  const handleRemoveMicrotask = (index: number) => {
    const updatedTasks = [...microtasks]
    updatedTasks.splice(index, 1)
    setMicrotasks(updatedTasks)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Decompositor de Tarefas</CardTitle>
          <CardDescription>Divida tarefas complexas em microtarefas gerenciáveis de 15 minutos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título da Tarefa</Label>
            <Input
              id="task-title"
              placeholder="Ex: Implementar autenticação"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição (opcional)</Label>
            <Textarea
              id="task-description"
              placeholder="Descreva a tarefa em mais detalhes..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button onClick={handleDecompose} disabled={isDecomposing || !taskTitle} className="w-full sm:w-auto">
              {isDecomposing ? (
                <>Decompondo...</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Decompor com IA
                </>
              )}
            </Button>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Input
                placeholder="Adicionar microtarefa manualmente"
                value={newMicrotask}
                onChange={(e) => setNewMicrotask(e.target.value)}
                className="w-full sm:w-auto"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddMicrotask()
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={handleAddMicrotask}
                disabled={!newMicrotask}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>

        {isDecomposing && (
          <CardFooter>
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Decompondo tarefa...</span>
                <span>50%</span>
              </div>
              <Progress value={50} className="h-2" aria-label="Progresso da decomposição" />
            </div>
          </CardFooter>
        )}
      </Card>

      {microtasks.length > 0 && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Microtarefas</CardTitle>
                <Badge variant="outline" className="ml-2">
                  {microtasks.length} tarefas • {microtasks.length * 15} min
                </Badge>
              </div>
              <CardDescription>
                Cada microtarefa deve levar aproximadamente 15 minutos para ser concluída
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {microtasks.map((task, index) => (
                  <motion.li
                    key={index}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-center justify-between rounded-md border p-3 hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                      </div>
                      <span>{task}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Marcar como concluída">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMicrotask(index)}
                        aria-label="Remover microtarefa"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" className="w-full sm:w-auto">
                  Salvar como template
                </Button>
                <Button className="w-full sm:w-auto">Iniciar sequência</Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
