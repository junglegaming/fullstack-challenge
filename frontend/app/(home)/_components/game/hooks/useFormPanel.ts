import { useForm } from "react-hook-form"
import { BetFormData, betSchema } from "../schemas/betSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { gameService } from "@/app/(home)/_services/game.service"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useGameStore } from "../store/game.store"
import { useEffect, useMemo, useState, useCallback } from "react"
import { numberToCurrency } from "@/lib/utils"
import { useAutoCashout } from "./useAutoCashout"

const useFormPanel = () => {
  const { data: session } = useSession()
  const [hasCashedOut, setHasCashedOut] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [autoCashoutConfig, setAutoCashoutConfig] = useState({
    isEnabled: false,
    multiplier: 2.0,
  })

  const status = useGameStore((s) => s.status)
  const roundId = useGameStore((s) => s.roundId)
  const currentMultiplier = useGameStore((s) => s.multiplier)

  const form = useForm<BetFormData>({
    resolver: zodResolver(betSchema),
    defaultValues: {
      amount: 0n,
      multiplierAtCashout: 1,
    },
  })

  const currentBet = form.watch("amount")
  const currentMultiplierInput = form.watch("multiplierAtCashout")

  const potentialWin = useMemo(() => {
    return (Number(currentBet) * currentMultiplierInput) / 100
  }, [currentBet, currentMultiplierInput])

  const resultCents = useMemo(
    () =>
      (currentBet * BigInt(Math.floor(currentMultiplierInput * 100))) / 100n,
    [currentBet, currentMultiplierInput]
  )

  const handleCashout = useCallback(async () => {
    const token = session?.user?.accessToken
    if (!token) {
      setShowAuthModal(true)
      return
    }

    try {
      const result = await gameService.betCashout(token, roundId)
      toast.success(`Saque de ${numberToCurrency(result.result)}!`)
      setHasCashedOut(true)
    } catch (error: any) {
      toast.error(error.message || "Erro ao sacar")
      throw error
    }
  }, [session?.user?.accessToken, roundId])

  const onSubmit = async () => {
    const token = session?.user?.accessToken
    if (!token) {
      setShowAuthModal(true)
      return
    }

    try {
      if (status === "RUNNING") {
        await handleCashout()
      } else {
        await gameService.createBet(token, {
          amount: resultCents.toString(),
        })
        toast.success(
          `Aposta de ${numberToCurrency(resultCents)} realizada com sucesso!`
        )
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao apostar")
    }
  }

  useAutoCashout({
    config: autoCashoutConfig,
    onCashout: handleCashout,
    isButtonDisabled: hasCashedOut,
  })

  const isButtonDisabled = status === "RUNNING" && hasCashedOut

  const buttonText = useMemo(() => {
    return status === "BETTING" ? "Apostar" : "Sacar"
  }, [status])

  useEffect(() => {
    if (status !== "RUNNING") {
      setHasCashedOut(false)
    }
  }, [status])

  return {
    form,
    onSubmit,
    potentialWin,
    isButtonDisabled,
    buttonText,
    showAuthModal,
    setShowAuthModal,
    autoCashoutConfig,
    setAutoCashoutConfig,
    currentMultiplier,
  }
}

export default useFormPanel
