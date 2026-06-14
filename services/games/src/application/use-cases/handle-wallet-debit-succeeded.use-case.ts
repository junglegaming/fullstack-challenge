import type { WalletDebitSucceededEnvelope } from "../messaging/wallet-events";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import { BetId } from "../../domain/value-objects/bet-id";
import { BetStatus } from "../../domain/value-objects/round-status";
import { RoundId } from "../../domain/value-objects/round-id";

export class HandleWalletDebitSucceededUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(envelope: WalletDebitSucceededEnvelope): Promise<void> {
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

    if (bet.status === BetStatus.PLACED) {
      return;
    }

    if (bet.status !== BetStatus.PENDING_DEBIT) {
      throw new Error(`Cannot accept bet from status ${bet.status}`);
    }

    round.confirmBetPlaced(betId);
    await this.roundsRepository.save(round);
  }
}
