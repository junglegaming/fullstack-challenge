import type {
  WalletCreditRequestedEnvelope,
  WalletDebitRequestedEnvelope,
} from "../messaging/wallet-events";

export const WALLET_COMMAND_PUBLISHER = Symbol("WALLET_COMMAND_PUBLISHER");

export interface WalletCommandPublisher {
  publishDebitRequested(envelope: WalletDebitRequestedEnvelope): Promise<void>;
  publishCreditRequested(envelope: WalletCreditRequestedEnvelope): Promise<void>;
}
