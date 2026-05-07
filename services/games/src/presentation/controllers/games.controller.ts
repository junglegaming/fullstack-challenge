import { Controller, Get, Post, Body, UseGuards, Req, Query, Param, Inject } from "@nestjs/common";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { GetUser } from "../decorators/get-user.decorator";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { PlaceBetUseCase } from "@/application/use-cases/place-bet.usecase";
import { CashoutUseCase } from "@/application/use-cases/cashout.usecase";
import { PlayerId } from "@/domain/value-objects/player-id.vo";
import { Money } from "@/domain/value-objects/money.vo";
import type { RoundRepository } from "@/domain/repositories/round.repository";
import { RoundResponseDto } from "@/application/dtos/round.response.dto";
import { BetResponseDto } from "@/application/dtos/bet.response.dto";
import { RoundStatus } from "@/domain/enums/round-status.enum";
import { BetStatus } from "@/domain/enums/bet-status.enum";

@Controller("games")
export class GamesController {
  constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashoutUseCase: CashoutUseCase,
    @Inject('RoundRepository') private readonly roundRepo: RoundRepository,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("rounds/current")
  async getCurrentRound(): Promise<RoundResponseDto> {
    const round = await this.roundRepo.getCurrent();
    return new RoundResponseDto(
      round.roundId.raw,
      round.roundStatus,
      round.roundCrashPoint.raw,
      round.multiplier.raw,
    );
  }

  @Get("rounds/history")
  async getHistory(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ): Promise<{ rounds: Array<{ roundId: string; crashPoint: number; createdAt: string }>; total: number }> {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    return {
      rounds: [],
      total: 0,
    };
  }

  @Get("rounds/:roundId/verify")
  async verifyRound(
    @Param("roundId") roundId: string,
  ): Promise<{
    roundId: string;
    crashPoint: number;
    hashedSeed: string;
    clientSeed: string;
    nonce: string;
    serverSeed: string | null;
    verified: boolean;
  }> {
    return {
      roundId,
      crashPoint: 0,
      hashedSeed: "",
      clientSeed: "",
      nonce: "",
      serverSeed: null,
      verified: false,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("bets/me")
  async getMyBets(
    @GetUser() user: { userId: string; username: string },
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ): Promise<{ bets: BetResponseDto[]; total: number }> {
    return { bets: [], total: 0 };
  }

  @UseGuards(JwtAuthGuard)
  @Post("bet")
  async placeBet(
    @GetUser() user: { userId: string; username: string },
    @Body() body: { amountCents: number },
  ): Promise<BetResponseDto> {
    const playerId = new PlayerId(user.userId);
    const amount = new Money(BigInt(body.amountCents));
    return this.placeBetUseCase.execute({
      playerId,
      amount,
    } as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post("bet/cashout")
  async cashoutBet(
    @GetUser() user: { userId: string; username: string },
  ): Promise<BetResponseDto> {
    const playerId = new PlayerId(user.userId);
    return this.cashoutUseCase.execute({
      playerId,
    } as any);
  }
}
