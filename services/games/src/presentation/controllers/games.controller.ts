import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CashOutBetUseCase } from "../../application/use-cases/cash-out-bet.use-case";
import { GetCurrentRoundUseCase } from "../../application/use-cases/get-current-round.use-case";
import { GetPlayerBetsUseCase } from "../../application/use-cases/get-player-bets.use-case";
import { GetRoundHistoryUseCase } from "../../application/use-cases/get-round-history.use-case";
import { GetRoundVerificationUseCase } from "../../application/use-cases/get-round-verification.use-case";
import { PlaceBetUseCase } from "../../application/use-cases/place-bet.use-case";
import type { PaginatedPlayerBetsDto } from "../../application/use-cases/get-player-bets.use-case";
import {
  CashOutResponseDto,
  PlaceBetCommandDto,
  PlaceBetResponseDto,
} from "../../application/dtos/bet-command.dto";
import type {
  CurrentRoundDto,
  PaginatedRoundHistoryDto,
} from "../../application/dtos/round-response.dto";
import type { RoundVerificationResponseDto } from "../dtos/round-verification-response.dto";
import { CurrentPlayer } from "../auth/current-player.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@ApiTags("games")
@Controller()
export class GamesController {
  constructor(
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly getRoundHistoryUseCase: GetRoundHistoryUseCase,
    private readonly getRoundVerificationUseCase: GetRoundVerificationUseCase,
    private readonly getPlayerBetsUseCase: GetPlayerBetsUseCase,
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutBetUseCase: CashOutBetUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("games/rounds/current")
  async getCurrentRound(): Promise<CurrentRoundDto> {
    return this.getCurrentRoundUseCase.execute();
  }

  @Get("games/rounds/history")
  async getRoundHistory(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<PaginatedRoundHistoryDto> {
    return this.getRoundHistoryUseCase.execute({
      page: parseOptionalInteger(page),
      pageSize: parseOptionalInteger(pageSize),
    });
  }

  @Get("games/rounds/:roundId/verify")
  async verifyRound(
    @Param("roundId") roundId: string,
  ): Promise<RoundVerificationResponseDto> {
    return this.getRoundVerificationUseCase.execute(roundId);
  }

  @Get("games/bets/me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyBets(
    @CurrentPlayer() playerId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<PaginatedPlayerBetsDto> {
    return this.getPlayerBetsUseCase.execute({
      playerId,
      page: parseOptionalInteger(page),
      pageSize: parseOptionalInteger(pageSize),
    });
  }

  @Post("games/bet")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: PlaceBetResponseDto })
  async placeBet(
    @CurrentPlayer() playerId: string,
    @Body() body: PlaceBetCommandDto,
  ): Promise<PlaceBetResponseDto> {
    return this.placeBetUseCase.execute({ playerId, body });
  }

  @Post("games/bet/cashout")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: CashOutResponseDto })
  async cashOut(@CurrentPlayer() playerId: string): Promise<CashOutResponseDto> {
    return this.cashOutBetUseCase.execute({ playerId });
  }
}

function parseOptionalInteger(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return undefined;
  }

  return parsed;
}
