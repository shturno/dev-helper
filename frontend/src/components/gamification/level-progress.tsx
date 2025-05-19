"use client"

import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"

interface LevelProgressProps {
  level: number
  xp: number
  xpToNextLevel: number
}

export function LevelProgress({ level, xp, xpToNextLevel }: LevelProgressProps) {
  const percentage = Math.min(100, Math.round((xp / xpToNextLevel) * 100))

  return (
    <div className="space-y-2">
      <Progress value={percentage} className="h-2" />
      <motion.div
        className="flex justify-between text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span>Nível {level}</span>
        <span>Nível {level + 1}</span>
      </motion.div>
    </div>
  )
}
