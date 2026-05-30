import { Inject, Injectable } from "@nestjs/common";
import { Money } from "@/domain/money";
import {
  DuplicateReservationError,
  InsufficientFundsError,
  WalletNotFoundError,
} from "@/domain/errors";
import { WALLET_REPOSITORY } from "./wallet.repository";
import type { WalletRepository } from "./wallet.repository";

export type ReserveResult =
  | {
      outcome: "reserved";
      playerId: string;
      reservationId: string;
      availableBalance: number;
    }
  | {
      outcome: "rejected";
      playerId: string;
      reservationId: string;
      reason: "insufficient_funds";
    }
  | { outcome: "duplicate" };

@Injectable()
export class ReserveWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepo: WalletRepository,
  ) {}

  async execute(
    reservationId: string,
    playerId: string,
    amount: number,
  ): Promise<ReserveResult> {
    const wallet = await this.walletRepo.findByPlayerId(playerId);
    if (!wallet) throw new WalletNotFoundError(playerId);

    try {
      wallet.reserve(reservationId, Money.fromCents(amount));
    } catch (err) {
      if (err instanceof DuplicateReservationError) {
        return { outcome: "duplicate" };
      }
      if (err instanceof InsufficientFundsError) {
        return {
          outcome: "rejected",
          playerId,
          reservationId,
          reason: "insufficient_funds",
        };
      }
      throw err;
    }

    await this.walletRepo.save(wallet);
    return {
      outcome: "reserved",
      playerId,
      reservationId,
      availableBalance: wallet.availableBalance.cents,
    };
  }
}
