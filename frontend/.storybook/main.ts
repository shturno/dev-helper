import type { StorybookConfig } from "@storybook/nextjs"
import type { RuleSetRule } from "webpack"

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-viewport",
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  docs: {
    autodocs: "tag",
    defaultName: "Documentação",
  },
  staticDirs: ["../public"],
  webpackFinal: async (config) => {
    if (config.module?.rules) {
      const cssRule = config.module.rules.find(
        (rule): rule is RuleSetRule => 
          rule !== "..." && 
          typeof rule === "object" && 
          rule !== null &&
          typeof rule.test === "object" &&
          rule.test.toString().includes("css")
      )
      if (cssRule && "use" in cssRule) {
        cssRule.use = [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("tailwindcss"),
                  require("autoprefixer"),
                  require("postcss-nested"),
                ],
              },
            },
          },
        ]
      }

      config.module.rules.push({
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      })
    }

    if (config.optimization) {
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      }
    }

    return config
  },
}

export default config 