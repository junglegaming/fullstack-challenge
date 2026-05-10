export interface CreateWalletDTO {
  userId: string;
}

export interface DepositMoneyDTO {
  userId: string;
  amountInCents: bigint;
}

export interface WithdrawMoneyDTO {
  userId: string;
  amountInCents: bigint;
}

export interface WalletResponseDTO {
  userId: string;
  balance: string;
  updatedAt: Date;
}