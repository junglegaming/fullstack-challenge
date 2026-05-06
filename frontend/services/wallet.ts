import api from "@/lib/api";

export interface Wallet {
  id: string;
  playerId: string;
  balanceCents: number;
}

export async function fetchWallet(): Promise<Wallet> {
  return api.get<Wallet>("/wallets/me");
}
