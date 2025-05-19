"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { CheckCircle } from "lucide-react"

export function FeatureSection() {
  const features = [
    "Sistema de microtarefas estilo RPG",
    "Modo hiperfoco com bloqueio de distrações",
    "Gamificação com XP e recompensas",
    "Priorização visual de tarefas",
    "Integração com Jira e GitHub",
    "Temas de acessibilidade",
    "Decomposição automática de tarefas",
    "Análise de horários produtivos",
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_800px]">
          <motion.div
            className="flex justify-center lg:order-last"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative h-[400px] w-full overflow-hidden rounded-xl">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Dashboard do TDAH Dev Helper"
                className="object-cover"
                fill
                priority
              />
            </div>
          </motion.div>
          <motion.div
            className="flex flex-col justify-center space-y-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ferramentas especializadas para desenvolvedores com TDAH
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Projetado por desenvolvedores com TDAH para desenvolvedores com TDAH. Nossas ferramentas ajudam você a
                manter o foco, gerenciar tarefas e aumentar a produtividade.
              </p>
            </div>
            <ul className="grid gap-2 py-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
