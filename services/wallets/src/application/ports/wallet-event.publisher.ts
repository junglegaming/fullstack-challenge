import type {
  WalletDebitFailedEnvelope,
  WalletDebitSucceededEnvelope,
} from "../messaging/wallet-events";

export const WALLET_EVENT_PUBLISHER = Symbol("WALLET_EVENT_PUBLISHER");

export interface WalletEventPublisher {
  publishDebitSucceeded(envelope: WalletDebitSucceededEnvelope): Promise<void>;
  publishDebitFailed(envelope: WalletDebitFailedEnvelope): Promise<void>;
}
