import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useGameStore } from "../store/game.store"
import { UseAutoCashoutProps } from "../interfaces/autoCashout"

export const useAutoCashout = ({
  config,
  onCashout,
}: UseAutoCashoutProps) => {
  const currentMultiplier = useGameStore((s) => s.multiplier)
  const status = useGameStore((s) => s.status)
  const hasTriggeredRef = useRef(false)
  const previousMultiplierRef = useRef(0)

  useEffect(() => {
    if (
      !config.isEnabled ||
      hasTriggeredRef.current ||
      status !== "RUNNING"
    ) {
      return
    }

    const wasBelowThreshold = previousMultiplierRef.current < config.multiplier
    const isNowAboveThreshold = currentMultiplier >= config.multiplier

    if (wasBelowThreshold && isNowAboveThreshold) {
      hasTriggeredRef.current = true
      onCashout()
        .then(() => {
          toast.success(
            `Auto cashout ativado em ${config.multiplier.toFixed(2)}x! 🎯`
          )
        })
        .catch(() => {
          hasTriggeredRef.current = false
        })
    }

    previousMultiplierRef.current = currentMultiplier
  }, [currentMultiplier, config.isEnabled, config.multiplier, status, onCashout])

  useEffect(() => {
    if (status === "BETTING") {
      hasTriggeredRef.current = false
      previousMultiplierRef.current = 0
    }
  }, [status])

  return {
    isAutoCashoutActive: config.isEnabled && status === "RUNNING",
  }
}