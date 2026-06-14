export type PlaceBetCommandDto = {
  amountCents: string;
};

export type PlaceBetResponseDto = {
  status: "PENDING";
  roundId: string;
  idempotencyKey: string;
};

export type CashOutResponseDto = {
  status: "PENDING";
  roundId: string;
  currentMultiplier: string;
  estimatedPayoutCents: string;
  idempotencyKey: string;
};
