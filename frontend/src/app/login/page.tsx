"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
})

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "Erro ao fazer login",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        })
        return
      }

      router.push("/dashboard")
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      })
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true)
    try {
      // Simulação de registro - em produção, isso seria uma chamada API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Conta criada com sucesso",
        description: "Você já pode fazer login com suas credenciais.",
      })

      // Redirecionar para a tab de login
      document.getElementById("login-tab")?.click()
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle GitHub sign in
  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("github", { callbackUrl: "/dashboard" })
    } catch (error) {
      toast({
        title: "Erro ao fazer login com GitHub",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">TDAH Dev Helper</h1>
          <p className="text-sm text-muted-foreground">Sua ferramenta para aumentar a produtividade</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" id="login-tab">
              Login
            </TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Entre com seu email e senha para acessar sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </Form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  disabled={isLoading}
                  onClick={handleGitHubSignIn}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  Ao continuar, você concorda com nossos{" "}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Termos de Serviço
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Criar conta</CardTitle>
                <CardDescription>Preencha os campos abaixo para criar sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </form>
                </Form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  disabled={isLoading}
                  onClick={handleGitHubSignIn}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  Ao continuar, você concorda com nossos{" "}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Termos de Serviço
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
