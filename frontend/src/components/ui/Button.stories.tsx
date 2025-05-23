import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "."

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Button",
  },
}

export const Disabled: Story = {
  args: {
    variant: "primary",
    children: "Button",
    disabled: true,
  },
} 