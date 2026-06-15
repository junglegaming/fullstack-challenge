import type { MessageEnvelope } from "./message-envelope";

export const WALLET_DEBIT_REQUESTED = "wallet.debit.requested";
export const WALLET_DEBIT_SUCCEEDED = "wallet.debit.succeeded";
export const WALLET_DEBIT_FAILED = "wallet.debit.failed";
export const WALLET_CREDIT_REQUESTED = "wallet.credit.requested";
export const WALLET_CREDIT_SUCCEEDED = "wallet.credit.succeeded";
export const WALLET_CREDIT_FAILED = "wallet.credit.failed";

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

export type WalletCreditRequestedPayload = {
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  reason: "BET_CASHOUT";
};

export type WalletCreditSucceededPayload = {
  playerId: string;
  walletId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  balanceAfterCents: string;
};

export type WalletCreditFailedPayload = {
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
export type WalletCreditRequestedEnvelope =
  MessageEnvelope<WalletCreditRequestedPayload>;
export type WalletCreditSucceededEnvelope =
  MessageEnvelope<WalletCreditSucceededPayload>;
export type WalletCreditFailedEnvelope =
  MessageEnvelope<WalletCreditFailedPayload>;
