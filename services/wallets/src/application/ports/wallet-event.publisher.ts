import type {
  WalletCreditFailedEnvelope,
  WalletCreditSucceededEnvelope,
  WalletDebitFailedEnvelope,
  WalletDebitSucceededEnvelope,
} from "../messaging/wallet-events";

export const WALLET_EVENT_PUBLISHER = Symbol("WALLET_EVENT_PUBLISHER");

export interface WalletEventPublisher {
  publishDebitSucceeded(envelope: WalletDebitSucceededEnvelope): Promise<void>;
  publishDebitFailed(envelope: WalletDebitFailedEnvelope): Promise<void>;
  publishCreditSucceeded(envelope: WalletCreditSucceededEnvelope): Promise<void>;
  publishCreditFailed(envelope: WalletCreditFailedEnvelope): Promise<void>;
}
