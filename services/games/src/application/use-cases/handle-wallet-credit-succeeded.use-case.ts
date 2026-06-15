import type { WalletCreditSucceededEnvelope } from "../messaging/wallet-events";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import { BetId } from "../../domain/value-objects/bet-id";
import { BetStatus } from "../../domain/value-objects/round-status";
import { PayoutSettlementStatus } from "../../domain/value-objects/payout-settlement-status";
import { RoundId } from "../../domain/value-objects/round-id";

export class HandleWalletCreditSucceededUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(envelope: WalletCreditSucceededEnvelope): Promise<void> {
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

    if (bet.payoutSettlementStatus === PayoutSettlementStatus.SETTLED) {
      return;
    }

    if (bet.status !== BetStatus.CASHED_OUT) {
      throw new Error(`Cannot settle payout for bet in status ${bet.status}`);
    }

    if (bet.payoutCreditIdempotencyKey !== envelope.idempotencyKey) {
      throw new Error(
        `Credit idempotency key mismatch for bet ${envelope.payload.betId}`,
      );
    }

    if (bet.payoutSettlementStatus === PayoutSettlementStatus.FAILED) {
      throw new Error(
        `Cannot settle payout that already failed for bet ${envelope.payload.betId}`,
      );
    }

    round.confirmPayoutSettled(betId);
    await this.roundsRepository.save(round);
  }
}
