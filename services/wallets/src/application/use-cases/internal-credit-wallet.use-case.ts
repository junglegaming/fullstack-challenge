import { PlayerId } from "../../domain/value-objects/player-id";
import { WalletTransactionType } from "../../domain/value-objects/wallet-transaction-type";
import { Money } from "../../domain/value-objects/money";
import { WalletMutationResult } from "../dtos/wallet-mutation-result.dto";
import { WalletRepository } from "../ports/wallet.repository";

export type InternalCreditWalletInput = {
  playerId: PlayerId;
  amount: Money;
  idempotencyKey: string;
  messageType: string;
};

export class InternalCreditWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(input: InternalCreditWalletInput): Promise<WalletMutationResult> {
    const result = await this.walletRepository.applyMutation({
      playerId: input.playerId,
      idempotencyKey: input.idempotencyKey,
      messageType: input.messageType,
      type: WalletTransactionType.CREDIT,
      amount: input.amount,
    });

    return {
      wallet: result.wallet,
      transaction: result.transaction,
      isReplay: result.isReplay,
    };
  }
}
