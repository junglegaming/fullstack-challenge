import { apiFetch } from "@/lib/api"
import { DepositMoneyDTO } from "../_types/Wallet"

export const walletService = {
  async getBalance(token: string): Promise<string> {
    const res = await apiFetch<{ data: { balance: string } }>("/wallets/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return (res.data.balance)
  },

  async createWallet(token: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/wallets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  async deposit(
    token: string,
    dto: DepositMoneyDTO
  ): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/wallets/deposit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    })
  },
}
