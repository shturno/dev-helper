import type { Preview, Decorator } from "@storybook/react"
import withThemeProvider from "@storybook/addon-themes"
import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport"
import React from "react"

// Configuração de temas otimizada para TDAH e acessibilidade
const themes = {
  default: "light",
  list: [
    { name: "light", class: "theme-light", color: "#ffffff" },
    { name: "dark", class: "theme-dark", color: "#000000" },
    { name: "high-contrast-light", class: "theme-high-contrast-light", color: "#ffffff" },
    { name: "high-contrast-dark", class: "theme-high-contrast-dark", color: "#000000" },
    { name: "matrix", class: "theme-matrix", color: "#000000" },
    { name: "dyslexia-friendly", class: "dyslexia-friendly", color: "#ffffff" },
  ],
}

// Decorador para wrapper da aplicação com suporte a temas
const withAppWrapper: Decorator = (Story) => (
  <div className="tdah-dev-helper" role="application" aria-label="TDAH Dev Helper">
    <Story />
  </div>
)

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
            options: { minContrastRatio: 4.5 },
          },
          {
            id: "heading-order",
            enabled: true,
          },
          {
            id: "aria-roles",
            enabled: true,
          },
        ],
      },
    },
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        mobile: {
          name: "Mobile",
          styles: {
            width: "360px",
            height: "640px",
          },
        },
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        desktop: {
          name: "Desktop",
          styles: {
            width: "1280px",
            height: "800px",
          },
        },
      },
    },
    themes,
  },
  decorators: [
    (withThemeProvider as unknown) as Decorator,
    withAppWrapper
  ],
}

export default preview 