"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Brain, Clock, Zap } from "lucide-react"
import { useReducedMotion } from "framer-motion"

import { Button } from "@/components/ui/button"

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: shouldReduceMotion ? 0 : 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: shouldReduceMotion
      ? { opacity: 1, transition: { duration: 0.5 } }
      : { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <motion.div
            className="flex flex-col justify-center space-y-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="space-y-2" variants={itemVariants}>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Potencialize sua produtividade com TDAH
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Ferramentas especialmente projetadas para desenvolvedores com TDAH dominarem seu fluxo de trabalho e
                aproveitarem o hiperfoco.
              </p>
            </motion.div>
            <motion.div className="flex flex-col gap-2 min-[400px]:flex-row" variants={itemVariants}>
              <Button asChild size="lg">
                <Link href="/login">
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                Saiba mais
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            className="flex items-center justify-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2">
              <div className="grid gap-4">
                <motion.div variants={itemVariants} className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Brain className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold">Modo Hiperfoco</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Maximize seus períodos de hiperfoco com ferramentas especializadas.
                  </p>
                </motion.div>
                <motion.div variants={itemVariants} className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Zap className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold">Gamificação</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ganhe XP, suba de nível e desbloqueie recompensas enquanto trabalha.
                  </p>
                </motion.div>
              </div>
              <div className="grid gap-4">
                <motion.div variants={itemVariants} className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold">Microtarefas</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Divida projetos complexos em tarefas gerenciáveis de 15 minutos.
                  </p>
                </motion.div>
                <motion.div variants={itemVariants} className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                      <path d="M10 2c1 .5 2 2 2 5" />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-semibold">Acessibilidade</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Suporte a dislexia, temas de alto contraste e navegação por teclado.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
