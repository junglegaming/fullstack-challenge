import { randomUUID } from "node:crypto";
import type {
  PlaceBetCommandDto,
  PlaceBetResponseDto,
} from "../dtos/bet-command.dto";
import { createMessageEnvelope } from "../messaging/message-envelope";
import { WALLET_DEBIT_REQUESTED } from "../messaging/wallet-events";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import type { WalletCommandPublisher } from "../ports/wallet-command.publisher";
import { Money } from "../../domain/value-objects/money";
import { PlayerId } from "../../domain/value-objects/player-id";

export class PlaceBetUseCase {
  constructor(
    private readonly roundsRepository: GameRoundsRepository,
    private readonly walletCommandPublisher: WalletCommandPublisher,
  ) {}

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

    await this.roundsRepository.save(round);
    await this.walletCommandPublisher.publishDebitRequested(
      createMessageEnvelope({
        type: WALLET_DEBIT_REQUESTED,
        producer: "games-service",
        idempotencyKey,
        payload: {
          playerId: input.playerId,
          roundId: round.id.toString(),
          betId: bet.id.toString(),
          amountCents: bet.amount.amountInCents.toString(),
          reason: "BET_PLACED",
        },
      }),
    );

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
