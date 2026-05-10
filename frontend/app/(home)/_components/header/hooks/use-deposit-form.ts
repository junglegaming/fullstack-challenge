import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DepositFormValues, depositSchema } from "../schema/depositSchema"
import { useSession } from "next-auth/react"
import { walletService } from "@/app/(home)/_services/wallet.service"
import { toast } from "sonner"

export function useDepositForm() {
  const { data: session } = useSession()

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema) as Resolver<DepositFormValues>,
    defaultValues: {
      amountInCents: "0n",
    },
    mode: "onChange",
  })

  const handleDeposit = async (data: DepositFormValues) => {
    const token = session?.user?.accessToken
    if (!token) {
      toast.error("Erro de autenticação")
      return
    }

    try {
      await walletService.deposit(token, { amountInCents: data.amountInCents })

      toast.success("Depósito realizado com sucesso!")
      form.reset()
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar depósito")
    }
  }

  return {
    form,
    handleDeposit,
  }
}
