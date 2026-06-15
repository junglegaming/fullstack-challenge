import { randomUUID } from "node:crypto";
import type { CashOutResponseDto } from "../dtos/bet-command.dto";
import { createMessageEnvelope } from "../messaging/message-envelope";
import { WALLET_CREDIT_REQUESTED } from "../messaging/wallet-events";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import type { WalletCommandPublisher } from "../ports/wallet-command.publisher";
import { Multiplier } from "../../domain/value-objects/multiplier";
import { PlayerId } from "../../domain/value-objects/player-id";

export class CashOutBetUseCase {
  constructor(
    private readonly roundsRepository: GameRoundsRepository,
    private readonly walletCommandPublisher: WalletCommandPublisher,
  ) {}

  async execute(input: { playerId: string }): Promise<CashOutResponseDto> {
    const round = await this.roundsRepository.findCurrent();
    const currentMultiplier = getCurrentMultiplier();
    const bet = round.cashOut({
      playerId: PlayerId.create(input.playerId),
      currentMultiplier,
    });
    const idempotencyKey = randomUUID();
    const payoutCents = bet.payout?.amountInCents.toString() ?? "0";

    await this.roundsRepository.save(round);
    await this.walletCommandPublisher.publishCreditRequested(
      createMessageEnvelope({
        type: WALLET_CREDIT_REQUESTED,
        producer: "games-service",
        idempotencyKey,
        payload: {
          playerId: input.playerId,
          roundId: round.id.toString(),
          betId: bet.id.toString(),
          amountCents: payoutCents,
          reason: "BET_CASHOUT",
        },
      }),
    );

    return {
      status: "PENDING",
      roundId: round.id.toString(),
      currentMultiplier: currentMultiplier.toDecimalString(),
      estimatedPayoutCents: payoutCents,
      idempotencyKey,
    };
  }
}

function getCurrentMultiplier(): Multiplier {
  // TODO: replace with the real server-time multiplier curve when the round loop is implemented.
  return Multiplier.one();
}
