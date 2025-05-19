"use client"

import * as React from "react"
import { Accessibility, Eye, Type, Keyboard, Monitor, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function AccessibilityMenu() {
  const { setTheme, theme } = useTheme()
  const [fontFamily, setFontFamily] = React.useState("default")
  const [fontSize, setFontSize] = React.useState("medium")
  const [highContrast, setHighContrast] = React.useState(false)
  const [reducedMotion, setReducedMotion] = React.useState(false)

  const applyDyslexicFont = () => {
    document.documentElement.style.setProperty("--font-sans", "'OpenDyslexic', sans-serif")
    setFontFamily("dyslexic")
  }

  const applyDefaultFont = () => {
    document.documentElement.style.removeProperty("--font-sans")
    setFontFamily("default")
  }

  const applyMatrixTheme = () => {
    setTheme("matrix")
  }

  const applyFontSize = (size: string) => {
    const sizes = {
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
      xlarge: "1.25rem",
    }
    document.documentElement.style.setProperty("--font-size-base", sizes[size as keyof typeof sizes])
    setFontSize(size)
  }

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    if (newValue) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion
    setReducedMotion(newValue)
    if (newValue) {
      document.documentElement.classList.add("reduced-motion")
    } else {
      document.documentElement.classList.remove("reduced-motion")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Opções de acessibilidade">
          <Accessibility className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Opções de acessibilidade</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Acessibilidade</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette className="mr-2 h-4 w-4" />
              <span>Temas</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">Tema claro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Tema escuro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="matrix">
                  Tema Matrix
                  <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    Nível 1
                  </span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">Usar tema do sistema</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Type className="mr-2 h-4 w-4" />
              <span>Fontes</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={fontFamily}
                onValueChange={(value) => {
                  if (value === "dyslexic") applyDyslexicFont()
                  else applyDefaultFont()
                }}
              >
                <DropdownMenuRadioItem value="default">Fonte padrão</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dyslexic">OpenDyslexic</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Eye className="mr-2 h-4 w-4" />
              <span>Tamanho do texto</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={applyFontSize}>
                <DropdownMenuRadioItem value="small">Pequeno</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">Médio</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="large">Grande</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="xlarge">Extra grande</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="flex items-center space-x-2">
            <Switch id="high-contrast" checked={highContrast} onCheckedChange={toggleHighContrast} />
            <Label htmlFor="high-contrast">Alto contraste</Label>
          </div>
        </div>

        <div className="px-2 py-1.5">
          <div className="flex items-center space-x-2">
            <Switch id="reduced-motion" checked={reducedMotion} onCheckedChange={toggleReducedMotion} />
            <Label htmlFor="reduced-motion">Reduzir animações</Label>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Keyboard className="mr-2 h-4 w-4" />
          <span>Atalhos de teclado</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Mais opções de acessibilidade</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
