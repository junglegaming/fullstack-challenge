import { Inject, Injectable } from "@nestjs/common";
import { Money } from "@/domain/money";
import { ReservationNotFoundError, WalletNotFoundError } from "@/domain/errors";
import { WALLET_REPOSITORY } from "./wallet.repository";
import type { WalletRepository } from "./wallet.repository";

export type SettleResult =
  | {
      outcome: "settled";
      playerId: string;
      reservationId: string;
      availableBalance: number;
    }
  | { outcome: "not_found" };

@Injectable()
export class SettleWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepo: WalletRepository,
  ) {}

  async execute(
    reservationId: string,
    playerId: string,
    betOutcome: "win" | "loss",
    payout?: number,
  ): Promise<SettleResult> {
    const wallet = await this.walletRepo.findByPlayerId(playerId);
    if (!wallet) throw new WalletNotFoundError(playerId);

    try {
      if (betOutcome === "win") {
        wallet.settleWin(reservationId, Money.fromCents(payout!));
      } else {
        wallet.settleLoss(reservationId);
      }
    } catch (err) {
      if (err instanceof ReservationNotFoundError) {
        return { outcome: "not_found" };
      }
      throw err;
    }

    await this.walletRepo.save(wallet);
    return {
      outcome: "settled",
      playerId,
      reservationId,
      availableBalance: wallet.availableBalance.cents,
    };
  }
}
