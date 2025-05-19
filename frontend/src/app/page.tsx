import Link from "next/link"
import { ArrowRight, Brain, Clock, Zap, CheckCircle, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
// Removendo a importação problemática do SkipLink

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Removendo o componente SkipLink que estava causando o erro */}
      {/* <SkipLink href="#main-content">Pular para o conteúdo principal</SkipLink> */}

      {/* Adicionando um link de acessibilidade simples em seu lugar */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Pular para o conteúdo principal
      </a>

      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2" aria-label="TDAH Dev Helper">
              <span className="inline-block font-bold">TDAH Dev Helper</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Recursos
              </Link>
              <Link
                href="#benefits"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Benefícios
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Depoimentos
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Button asChild size="sm">
                <Link href="/login">
                  Começar <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Potencialize sua produtividade com TDAH
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Ferramentas especialmente projetadas para desenvolvedores com TDAH dominarem seu fluxo de trabalho e
                    aproveitarem o hiperfoco.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">
                      Começar agora <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#features">Saiba mais</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2">
                  <div className="grid gap-4">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Brain className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 font-semibold">Modo Hiperfoco</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Maximize seus períodos de hiperfoco com ferramentas especializadas.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Zap className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 font-semibold">Gamificação</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Ganhe XP, suba de nível e desbloqueie recompensas enquanto trabalha.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Clock className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 font-semibold">Microtarefas</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Divida projetos complexos em tarefas gerenciáveis de 15 minutos.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_800px]">
              <div className="flex justify-center lg:order-last">
                <div className="relative h-[400px] w-full overflow-hidden rounded-xl">
                  <img
                    src="/placeholder.svg?height=400&width=600"
                    alt="Dashboard do TDAH Dev Helper"
                    className="object-cover h-full w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Ferramentas especializadas para desenvolvedores com TDAH
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Projetado por desenvolvedores com TDAH para desenvolvedores com TDAH. Nossas ferramentas ajudam você
                    a manter o foco, gerenciar tarefas e aumentar a produtividade.
                  </p>
                </div>
                <ul className="grid gap-2 py-4 sm:grid-cols-2">
                  {[
                    "Sistema de microtarefas estilo RPG",
                    "Modo hiperfoco com bloqueio de distrações",
                    "Gamificação com XP e recompensas",
                    "Priorização visual de tarefas",
                    "Integração com Jira e GitHub",
                    "Temas de acessibilidade",
                    "Decomposição automática de tarefas",
                    "Análise de horários produtivos",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Benefícios para desenvolvedores com TDAH
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nossa plataforma foi projetada para ajudar desenvolvedores com TDAH a superar desafios comuns e
                  transformar características únicas em vantagens competitivas.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Brain className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold">Aproveite o Hiperfoco</h3>
                <p className="text-center text-muted-foreground">
                  Transforme períodos de hiperfoco em produtividade máxima com nosso ambiente otimizado e livre de
                  distrações.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold">Gerenciamento de Tempo</h3>
                <p className="text-center text-muted-foreground">
                  Divida projetos complexos em microtarefas gerenciáveis e use técnicas de tempo comprovadas para TDAH.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Star className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold">Motivação Constante</h3>
                <p className="text-center text-muted-foreground">
                  Mantenha-se motivado com nosso sistema de gamificação, recompensas e feedback visual imediato.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">O que nossos usuários dizem</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Desenvolvedores com TDAH de todo o mundo estão transformando sua produtividade com o TDAH Dev Helper.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote:
                    "Finalmente consigo aproveitar meus períodos de hiperfoco sem me perder. Minha produtividade aumentou 200%!",
                  author: "Carlos Silva",
                  role: "Desenvolvedor Frontend",
                },
                {
                  quote:
                    "O sistema de microtarefas mudou minha vida. Agora consigo dividir projetos grandes em partes gerenciáveis.",
                  author: "Ana Oliveira",
                  role: "Desenvolvedora Full Stack",
                },
                {
                  quote:
                    "A gamificação me mantém motivado. Adoro desbloquear novas recompensas enquanto completo meu trabalho.",
                  author: "Pedro Santos",
                  role: "Engenheiro de Software",
                },
              ].map((testimonial, index) => (
                <div key={index} className="flex flex-col justify-between space-y-4 rounded-lg border p-6 shadow-sm">
                  <p className="text-muted-foreground">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Pronto para transformar sua produtividade?
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Junte-se a milhares de desenvolvedores com TDAH que estão aproveitando ao máximo seu potencial.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/login">
                    Começar agora <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} TDAH Dev Helper. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Termos
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Privacidade
            </Link>
            <Link
              href="/accessibility"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Acessibilidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
