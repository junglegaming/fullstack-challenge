import { Inject, Injectable, Logger } from "@nestjs/common";
import { Money } from "../../domain/value-objects/money.vo";
import { ID_GENERATOR } from "../ports/id-generator";
import type { IdGenerator } from "../ports/id-generator";
import { WALLET_REPOSITORY } from "../ports/wallet.repository";
import type { WalletRepository } from "../ports/wallet.repository";
import { GetOrCreateWalletUseCase } from "./get-or-create-wallet.use-case";

export interface CreditCommand {
  playerId: string;

  amountCents: string;

  reference: string;
}

export interface CreditResult {
  status: "SUCCEEDED";
  balanceCents: string;
}

@Injectable()
export class CreditWalletUseCase {
  private readonly logger = new Logger(CreditWalletUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly wallets: WalletRepository,
    @Inject(ID_GENERATOR)
    private readonly ids: IdGenerator,
    private readonly getOrCreate: GetOrCreateWalletUseCase,
  ) {}

  async execute(command: CreditCommand): Promise<CreditResult> {

    const wallet = await this.getOrCreate.execute(command.playerId);

    const already = await this.wallets.findTransactionByReference(
      command.reference,
    );
    if (already) {
      this.logger.debug(
        `Credit ${command.reference} already processed; replaying result`,
      );
      return {
        status: "SUCCEEDED",
        balanceCents: already.balanceAfter.toCents().toString(),
      };
    }

    const amount = Money.fromCents(command.amountCents);

    const transaction = wallet.credit(amount, command.reference, {
      transactionId: this.ids.generate(),
      now: new Date(),
    });

    await this.wallets.applyTransaction(wallet, transaction);
    return {
      status: "SUCCEEDED",
      balanceCents: wallet.getBalance().toCents().toString(),
    };
  }
}
