import { randomUUID } from "node:crypto";
import type {
  PlaceBetCommandDto,
  PlaceBetResponseDto,
} from "../dtos/bet-command.dto";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import { Money } from "../../domain/value-objects/money";
import { PlayerId } from "../../domain/value-objects/player-id";

export class PlaceBetUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(input: {
    playerId: string;
    body: PlaceBetCommandDto;
  }): Promise<PlaceBetResponseDto> {
    const round = await this.roundsRepository.findCurrent();
    const idempotencyKey = randomUUID();
    const bet = round.placeBet({
      playerId: PlayerId.create(input.playerId),
      amount: parseMoneyFromCentsString(input.body.amountCents),
      idempotencyKey,
      now: new Date(),
    });

    // Temporary wallet mock: assume the debit succeeds immediately until RabbitMQ is wired.
    round.confirmBetPlaced(bet.id);
    await this.roundsRepository.save(round);

    return {
      status: "PENDING",
      roundId: round.id.toString(),
      idempotencyKey,
    };
  }
}

function parseMoneyFromCentsString(value: string): Money {
  if (!/^\d+$/.test(value)) {
    throw new Error("amountCents must be an integer string");
  }

  return Money.fromCents(BigInt(value));
}
