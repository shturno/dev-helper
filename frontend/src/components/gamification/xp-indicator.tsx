"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface XPIndicatorProps {
  xp: number
}

export function XPIndicator({ xp }: XPIndicatorProps) {
  return (
    <motion.div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Sparkles className="h-4 w-4" />
    </motion.div>
  )
}
