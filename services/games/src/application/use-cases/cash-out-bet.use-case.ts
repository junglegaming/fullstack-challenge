import { randomUUID } from "node:crypto";
import type { GameRoundEngineConfig } from "../config/game-round-engine.config";
import type { CashOutResponseDto } from "../dtos/bet-command.dto";
import { createMessageEnvelope } from "../messaging/message-envelope";
import { WALLET_CREDIT_REQUESTED } from "../messaging/wallet-events";
import type { GameRealtimePublisher } from "../ports/game-realtime.publisher";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import type { WalletCommandPublisher } from "../ports/wallet-command.publisher";
import { PlayerId } from "../../domain/value-objects/player-id";

export class CashOutBetUseCase {
  constructor(
    private readonly roundsRepository: GameRoundsRepository,
    private readonly walletCommandPublisher: WalletCommandPublisher,
    private readonly engineConfig?: Pick<
      GameRoundEngineConfig,
      "multiplierGrowthBasisPointsPerSecond"
    >,
    private readonly realtimePublisher?: GameRealtimePublisher,
  ) {}

  async execute(input: { playerId: string }): Promise<CashOutResponseDto> {
    const round = await this.roundsRepository.findCurrent();
    const currentMultiplier = round.getCurrentMultiplier(new Date(), {
      growthBasisPointsPerSecond:
        this.engineConfig?.multiplierGrowthBasisPointsPerSecond,
    });
    const idempotencyKey = randomUUID();
    const bet = round.cashOut({
      playerId: PlayerId.create(input.playerId),
      currentMultiplier,
      payoutCreditIdempotencyKey: idempotencyKey,
    });
    const payoutCents = bet.payout?.amountInCents.toString() ?? "0";

    await this.roundsRepository.save(round);
    await this.realtimePublisher?.publishBetCashedOut({
      roundId: round.id.toString(),
      betId: bet.id.toString(),
      playerId: bet.playerId.toString(),
      cashOutMultiplier: currentMultiplier.toDecimalString(),
      payoutCents,
    });
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
