export const EXCHANGE = "crash.exchange";

export const RoutingKeys = {
  DebitRequested: "wallet.debit.requested",
  CreditRequested: "wallet.credit.requested",
  DebitSucceeded: "wallet.debit.succeeded",
  DebitFailed: "wallet.debit.failed",
  CreditSucceeded: "wallet.credit.succeeded",
} as const;

export type RoutingKey = (typeof RoutingKeys)[keyof typeof RoutingKeys];

export interface DebitRequestedEvent {
  betId: string;
  roundId: string;
  playerId: string;
  amountCents: string;
}

export interface CreditRequestedEvent {
  betId: string;
  roundId: string;
  playerId: string;
  amountCents: string;
}

export interface DebitSucceededEvent {
  betId: string;
  roundId: string;
  playerId: string;
  balanceCents: string;
}

export interface DebitFailedEvent {
  betId: string;
  roundId: string;
  playerId: string;
  reason: string;
}

export interface CreditSucceededEvent {
  betId: string;
  roundId: string;
  playerId: string;
  balanceCents: string;
}
