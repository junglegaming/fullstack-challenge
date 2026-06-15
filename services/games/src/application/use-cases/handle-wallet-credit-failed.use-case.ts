import type { WalletCreditFailedEnvelope } from "../messaging/wallet-events";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import { BetId } from "../../domain/value-objects/bet-id";
import { BetStatus } from "../../domain/value-objects/round-status";
import { PayoutSettlementStatus } from "../../domain/value-objects/payout-settlement-status";
import { RoundId } from "../../domain/value-objects/round-id";

export class HandleWalletCreditFailedUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(envelope: WalletCreditFailedEnvelope): Promise<void> {
    const round = await this.roundsRepository.findById(
      RoundId.create(envelope.payload.roundId),
    );

    if (!round) {
      throw new Error(`Round ${envelope.payload.roundId} not found`);
    }

    const betId = BetId.create(envelope.payload.betId);
    const bet = round.getBetById(betId);

    if (!bet) {
      throw new Error(`Bet ${envelope.payload.betId} not found`);
    }

    if (bet.payoutSettlementStatus === PayoutSettlementStatus.FAILED) {
      return;
    }

    if (bet.status !== BetStatus.CASHED_OUT) {
      throw new Error(
        `Cannot mark payout settlement failed for bet in status ${bet.status}`,
      );
    }

    if (bet.payoutCreditIdempotencyKey !== envelope.idempotencyKey) {
      throw new Error(
        `Credit idempotency key mismatch for bet ${envelope.payload.betId}`,
      );
    }

    if (bet.payoutSettlementStatus === PayoutSettlementStatus.SETTLED) {
      throw new Error(
        `Cannot fail payout settlement that is already settled for bet ${envelope.payload.betId}`,
      );
    }

    round.markPayoutSettlementFailed(betId, envelope.payload.reason);
    await this.roundsRepository.save(round);
  }
}
