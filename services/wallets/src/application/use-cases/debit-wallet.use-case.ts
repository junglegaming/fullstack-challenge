import { Inject, Injectable, Logger } from "@nestjs/common";
import { InsufficientFundsError } from "../../domain/errors/wallet.errors";
import { Money } from "../../domain/value-objects/money.vo";
import { ID_GENERATOR } from "../ports/id-generator";
import type { IdGenerator } from "../ports/id-generator";
import { WALLET_REPOSITORY } from "../ports/wallet.repository";
import type { WalletRepository } from "../ports/wallet.repository";
import { GetOrCreateWalletUseCase } from "./get-or-create-wallet.use-case";

export interface DebitCommand {
  playerId: string;

  amountCents: string;

  reference: string;
}

export type DebitResult =
  | { status: "SUCCEEDED"; balanceCents: string }
  | { status: "FAILED"; reason: string; balanceCents: string };

@Injectable()
export class DebitWalletUseCase {
  private readonly logger = new Logger(DebitWalletUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly wallets: WalletRepository,
    @Inject(ID_GENERATOR)
    private readonly ids: IdGenerator,
    private readonly getOrCreate: GetOrCreateWalletUseCase,
  ) {}

  async execute(command: DebitCommand): Promise<DebitResult> {

    const wallet = await this.getOrCreate.execute(command.playerId);

    const already = await this.wallets.findTransactionByReference(
      command.reference,
    );
    if (already) {
      this.logger.debug(
        `Debit ${command.reference} already processed; replaying result`,
      );
      return {
        status: "SUCCEEDED",
        balanceCents: already.balanceAfter.toCents().toString(),
      };
    }

    const amount = Money.fromCents(command.amountCents);
    try {

      const transaction = wallet.debit(amount, command.reference, {
        transactionId: this.ids.generate(),
        now: new Date(),
      });
      await this.wallets.applyTransaction(wallet, transaction);
      return {
        status: "SUCCEEDED",
        balanceCents: wallet.getBalance().toCents().toString(),
      };
    } catch (error) {

      if (error instanceof InsufficientFundsError) {
        return {
          status: "FAILED",
          reason: "INSUFFICIENT_FUNDS",
          balanceCents: wallet.getBalance().toCents().toString(),
        };
      }
      throw error;
    }
  }
}
