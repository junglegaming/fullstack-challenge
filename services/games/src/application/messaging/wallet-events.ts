import type { MessageEnvelope } from "./message-envelope";

export const WALLET_DEBIT_REQUESTED = "wallet.debit.requested";
export const WALLET_DEBIT_SUCCEEDED = "wallet.debit.succeeded";
export const WALLET_DEBIT_FAILED = "wallet.debit.failed";

export type WalletDebitRequestedPayload = {
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  reason: "BET_PLACED";
};

export type WalletDebitSucceededPayload = {
  playerId: string;
  walletId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  balanceAfterCents: string;
};

export type WalletDebitFailedPayload = {
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  reason: string;
};

export type WalletDebitRequestedEnvelope =
  MessageEnvelope<WalletDebitRequestedPayload>;
export type WalletDebitSucceededEnvelope =
  MessageEnvelope<WalletDebitSucceededPayload>;
export type WalletDebitFailedEnvelope = MessageEnvelope<WalletDebitFailedPayload>;
