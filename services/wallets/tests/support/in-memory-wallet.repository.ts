import {
  ApplyWalletMutationInput,
  ApplyWalletMutationResult,
  WalletRepository,
} from "../../src/application/ports/wallet.repository";
import { ProcessedMessage } from "../../src/domain/entities/processed-message";
import { Wallet } from "../../src/domain/entities/wallet";
import { WalletTransaction } from "../../src/domain/entities/wallet-transaction";
import { WalletNotFoundError } from "../../src/domain/errors/wallet-not-found.error";
import { PlayerId } from "../../src/domain/value-objects/player-id";
import { WalletTransactionType } from "../../src/domain/value-objects/wallet-transaction-type";

export class InMemoryWalletRepository implements WalletRepository {
  private wallets = new Map<string, Wallet>();
  private transactions = new Map<string, WalletTransaction>();
  private processedMessages = new Map<string, ProcessedMessage>();

  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null> {
    return this.wallets.get(playerId.toString()) ?? null;
  }

  async save(wallet: Wallet): Promise<void> {
    this.wallets.set(wallet.playerId.toString(), wallet);

    if (wallet.balance.amountInCents > 0n) {
      const transaction = WalletTransaction.create({
        walletId: wallet.id,
        type: WalletTransactionType.CREDIT,
        amount: wallet.balance,
        balanceAfter: wallet.balance,
        idempotencyKey: `wallet-init-${wallet.id.toString()}`,
      });

      this.transactions.set(transaction.idempotencyKey, transaction);
    }
  }

  async applyMutation(input: ApplyWalletMutationInput): Promise<ApplyWalletMutationResult> {
    const replay = await this.findReplayResult(input.idempotencyKey);

    if (replay) {
      return replay;
    }

    const wallet = this.wallets.get(input.playerId.toString());

    if (!wallet) {
      throw new WalletNotFoundError(input.playerId.toString());
    }

    const mutation =
      input.type === WalletTransactionType.CREDIT
        ? wallet.credit(input.amount, input.idempotencyKey)
        : wallet.debit(input.amount, input.idempotencyKey);

    this.wallets.set(input.playerId.toString(), mutation.wallet);
    this.transactions.set(mutation.transaction.idempotencyKey, mutation.transaction);

    const processedMessage = ProcessedMessage.create({
      idempotencyKey: input.idempotencyKey,
      messageType: input.messageType,
      walletTransactionId: mutation.transaction.id,
    });

    this.processedMessages.set(processedMessage.idempotencyKey, processedMessage);

    return {
      wallet: mutation.wallet,
      transaction: mutation.transaction,
      isReplay: false,
    };
  }

  private async findReplayResult(
    idempotencyKey: string,
  ): Promise<ApplyWalletMutationResult | null> {
    const processedMessage = this.processedMessages.get(idempotencyKey);

    if (!processedMessage) {
      return null;
    }

    const transaction = this.transactions.get(idempotencyKey);

    if (!transaction) {
      return null;
    }

    const wallet = [...this.wallets.values()].find(
      (item) => item.id.toString() === transaction.walletId.toString(),
    );

    if (!wallet) {
      return null;
    }

    return {
      wallet,
      transaction,
      isReplay: true,
    };
  }
}
