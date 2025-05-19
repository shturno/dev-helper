"use client"

import { motion } from "framer-motion"
import { Lock, Check } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Reward {
  id: number
  title: string
  description: string
  progress: number
  unlocked: boolean
}

interface RewardCardProps {
  reward: Reward
}

export function RewardCard({ reward }: RewardCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative rounded-md border p-3 transition-colors",
        reward.unlocked ? "border-primary" : "hover:border-primary/50",
      )}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{reward.title}</h4>
          <p className="text-xs text-muted-foreground">{reward.description}</p>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
          {reward.unlocked ? (
            <Check className="h-3 w-3 text-primary" />
          ) : (
            <Lock className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {reward.unlocked ? "Desbloqueado" : `${reward.progress}% completo`}
          </span>
        </div>
        <Progress value={reward.progress} className="h-1" />
      </div>
    </motion.div>
  )
}
