export interface CreateBetUseCaseDTO {
  userId: string;
  amount: bigint;
}

export interface BetResponseDTO {
  id: string;
  userId: string;
  roundId: string;
  amount: bigint;
  status: "PENDING" | "WON" | "LOST";
  createdAt: Date;
}

export interface BetCashoutUseCaseDTO {
  userId: string;
  roundId: string;
}

export interface BetCashoutResponseDTO {
  id: string;
  userId: string;
  roundId: string;
  amount: bigint;
  cashoutAmount: bigint;
  createdAt: Date;
}
