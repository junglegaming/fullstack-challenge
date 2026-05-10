"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
export function useFormAuth() {
  const [isLoading, setIsLoading] = useState(false)


  async function handleLogin() {
    setIsLoading(true)
    try {
      await signIn("keycloak", { callbackUrl: "/" })
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      toast.error("Erro ao fazer login. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    handleLogin,
  }
}
