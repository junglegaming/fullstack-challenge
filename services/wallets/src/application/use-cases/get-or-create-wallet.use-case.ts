import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Wallet } from "../../domain/entities/wallet.aggregate";
import { Money } from "../../domain/value-objects/money.vo";
import { ID_GENERATOR } from "../ports/id-generator";
import type { IdGenerator } from "../ports/id-generator";
import { WALLET_REPOSITORY } from "../ports/wallet.repository";
import type { WalletRepository } from "../ports/wallet.repository";

@Injectable()
export class GetOrCreateWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly wallets: WalletRepository,
    @Inject(ID_GENERATOR)
    private readonly ids: IdGenerator,
    private readonly config: ConfigService,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    const existing = await this.wallets.findByPlayerId(playerId);
    if (existing) {
      return existing;
    }

    const startingCents = this.config.get<string>(
      "STARTING_BALANCE_CENTS",
      "0",
    );
    const wallet = Wallet.create({
      id: this.ids.generate(),
      playerId,
      initialBalance: Money.fromCents(startingCents),
      now: new Date(),
    });
    return this.wallets.create(wallet);
  }
}
