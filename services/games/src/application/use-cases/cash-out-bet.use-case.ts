import { randomUUID } from "node:crypto";
import type { CashOutResponseDto } from "../dtos/bet-command.dto";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import { Multiplier } from "../../domain/value-objects/multiplier";
import { PlayerId } from "../../domain/value-objects/player-id";

export class CashOutBetUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(input: { playerId: string }): Promise<CashOutResponseDto> {
    const round = await this.roundsRepository.findCurrent();
    const currentMultiplier = getCurrentMultiplier();
    const bet = round.cashOut({
      playerId: PlayerId.create(input.playerId),
      currentMultiplier,
    });
    const idempotencyKey = randomUUID();

    // Temporary wallet mock: the future broker flow will publish wallet.credit.requested.
    await this.roundsRepository.save(round);

    return {
      status: "PENDING",
      roundId: round.id.toString(),
      currentMultiplier: currentMultiplier.toDecimalString(),
      estimatedPayoutCents: bet.payout?.amountInCents.toString() ?? "0",
      idempotencyKey,
    };
  }
}

function getCurrentMultiplier(): Multiplier {
  // TODO: replace with the real server-time multiplier curve when the round loop is implemented.
  return Multiplier.one();
}
