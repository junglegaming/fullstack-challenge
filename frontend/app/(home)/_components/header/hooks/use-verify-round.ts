"use client"

import { useState } from "react"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { gameService } from "@/app/(home)/_services/game.service"
import {
  verifyRoundSchema,
  verifyRoundFormValues,
} from "../schema/verifyRoundSchema"

const useVerifyRound = () => {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [verificationData, setVerificationData] = useState<{
    id: string
    status: "BETTING" | "RUNNING" | "CRASHED"
    crashPoint: number
    startTime: string
    endTime: string
    serverSeed: string
    serverSeedHash: string
    clientSeed: string
    nonce: number
  } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const form = useForm<verifyRoundFormValues>({
    resolver: zodResolver(verifyRoundSchema) as Resolver<verifyRoundFormValues>,
    defaultValues: {
      roundId: "",
    },
    mode: "onChange",
  })

  const handleVerify = async () => {
    const { roundId } = form.getValues()

    if (!roundId || !roundId.trim()) {
      toast.error("Digite o ID da rodada")
      return
    }

    setLoading(true)
    try {
      const response = await gameService.verifyRound(roundId)

      setVerificationData(response?.data)
      toast.success("Rodada verificada com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao verificar rodada")
      setVerificationData(null)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success("Copiado!")
    setTimeout(() => setCopied(null), 2000)
  }

  return {
    form,
    handleVerify,
    loading,
    verificationData,
    open,
    setOpen,
    copied,
    copyToClipboard
  }
}

export default useVerifyRound
