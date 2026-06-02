import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { GameLoop } from "../../application/game-loop";
import { TypeOrmGameRepository } from "../../infrastructure/persistence/typeorm-game.repository";
import { MultiplierCalculator } from "../../domain/multiplier-calculator";
import { RoundState } from "../../domain/round";
import type { Round } from "../../domain/round";

@Controller()
export class RoundsController {
  constructor(
    private readonly gameLoop: GameLoop,
    private readonly repository: TypeOrmGameRepository,
  ) {}

  @Get("rounds/current")
  getCurrentRound() {
    const round = this.gameLoop.getCurrentRound();
    if (!round) return null;
    return this.toDto(round);
  }

  @Get("rounds/history")
  async getRoundHistory(
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const { data, total } = await this.repository.findCompletedRounds(
      Math.max(1, Number(page)),
      Math.min(100, Math.max(1, Number(limit))),
    );
    return {
      data: data.map((r) => this.toDto(r)),
      total,
      page: Number(page),
    };
  }

  @Get("rounds/:roundId/verify")
  async verifyRound(@Param("roundId") roundId: string) {
    const round = await this.repository.findRoundById(roundId);
    if (!round) throw new NotFoundException(`Round ${roundId} not found`);
    return {
      roundId: round.id,
      seed: round.seed,
      hash: round.hash,
      crashPoint: round.crashPoint,
      instructions:
        "Verify: HMAC-SHA256(HOUSE_KEY, seed) === hash, then apply the public crash-point formula.",
    };
  }

  private toDto(round: Round) {
    const isRunning = round.state === RoundState.RUNNING && round.startedAt;
    const multiplier = isRunning
      ? MultiplierCalculator.calculate(round.startedAt!)
      : null;

    return {
      roundId: round.id,
      state: round.state,
      hash: round.hash,
      seed: round.state === RoundState.CRASHED ? round.seed : null,
      crashPoint: round.state === RoundState.CRASHED ? round.crashPoint : null,
      startedAt: round.startedAt,
      bettingEndsAt: this.gameLoop.getBettingEndsAt(),
      multiplier,
      bets: [...round.bets.values()].map((b) => ({
        playerId: b.playerId,
        amountCents: b.amount.cents,
        status: b.status,
        payoutCents: b.payout?.cents ?? null,
      })),
    };
  }
}
