import { Wallet } from "../../domain/entities/wallet";
import { WalletTransaction } from "../../domain/entities/wallet-transaction";
import { PlayerId } from "../../domain/value-objects/player-id";
import { WalletTransactionType } from "../../domain/value-objects/wallet-transaction-type";
import { Money } from "../../domain/value-objects/money";

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");

export type ApplyWalletMutationInput = {
  playerId: PlayerId;
  idempotencyKey: string;
  messageType: string;
  type: WalletTransactionType;
  amount: Money;
};

export type ApplyWalletMutationResult = {
  wallet: Wallet;
  transaction: WalletTransaction;
  isReplay: boolean;
};

export interface WalletRepository {
  findByPlayerId(playerId: PlayerId): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
  applyMutation(input: ApplyWalletMutationInput): Promise<ApplyWalletMutationResult>;
}
