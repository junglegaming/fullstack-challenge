import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CashOutUseCase } from "../../application/use-cases/cash-out.use-case";
import { GetCurrentRoundUseCase } from "../../application/use-cases/get-current-round.use-case";
import { GetMyBetsUseCase } from "../../application/use-cases/get-my-bets.use-case";
import { GetRoundHistoryUseCase } from "../../application/use-cases/get-round-history.use-case";
import { PlaceBetUseCase } from "../../application/use-cases/place-bet.use-case";
import {
  RoundVerification,
  VerifyRoundUseCase,
} from "../../application/use-cases/verify-round.use-case";
import type { AuthenticatedUser } from "../../infrastructure/auth/authenticated-user";
import { CurrentUser } from "../../infrastructure/auth/current-user.decorator";
import { KeycloakJwtGuard } from "../../infrastructure/auth/keycloak-jwt.guard";
import { BetResponseDto } from "../dtos/bet-response.dto";
import { PlaceBetDto } from "../dtos/place-bet.dto";
import { RoundResponseDto } from "../dtos/round-response.dto";

interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@ApiTags("games")
@Controller("games")
export class GamesController {
  constructor(
    private readonly getCurrentRound: GetCurrentRoundUseCase,
    private readonly getRoundHistory: GetRoundHistoryUseCase,
    private readonly verifyRound: VerifyRoundUseCase,
    private readonly getMyBets: GetMyBetsUseCase,
    private readonly placeBet: PlaceBetUseCase,
    private readonly cashOut: CashOutUseCase,
  ) {}

  @Get("rounds/current")
  @ApiOperation({ summary: "Current round with its bets and live multiplier" })
  @ApiOkResponse({ type: RoundResponseDto })
  currentRound(): RoundResponseDto | null {
    const { round, liveMultiplier } = this.getCurrentRound.execute();
    return round ? RoundResponseDto.fromDomain(round, liveMultiplier) : null;
  }

  @Get("rounds/history")
  @ApiOperation({ summary: "Paginated history of finished rounds" })
  async history(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<PaginatedDto<RoundResponseDto>> {
    const { p, l } = parsePagination(page, limit);
    const result = await this.getRoundHistory.execute(p, l);
    return {

      items: result.items.map((round) =>
        RoundResponseDto.fromDomain(round, round.crashPoint),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get("rounds/:roundId/verify")
  @ApiOperation({ summary: "Provably-fair verification data for a round" })
  verify(@Param("roundId") roundId: string): Promise<RoundVerification> {
    return this.verifyRound.execute(roundId);
  }

  @Get("bets/me")
  @ApiBearerAuth()
  @UseGuards(KeycloakJwtGuard)
  @ApiOperation({ summary: "Authenticated player's paginated bet history" })
  async myBets(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<PaginatedDto<BetResponseDto>> {
    const { p, l } = parsePagination(page, limit);
    const result = await this.getMyBets.execute(user.playerId, p, l);
    return {
      items: result.items.map((bet) => BetResponseDto.fromDomain(bet)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Post("bet")
  @ApiBearerAuth()
  @UseGuards(KeycloakJwtGuard)
  @ApiOperation({ summary: "Place a bet in the current betting phase" })
  @ApiOkResponse({ type: BetResponseDto })
  async bet(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PlaceBetDto,
  ): Promise<BetResponseDto> {
    const bet = await this.placeBet.execute({
      playerId: user.playerId,
      username: user.username,
      amount: body.amount,
    });
    return BetResponseDto.fromDomain(bet);
  }

  @Post("bet/cashout")
  @ApiBearerAuth()
  @UseGuards(KeycloakJwtGuard)
  @ApiOperation({ summary: "Cash out the active bet at the current multiplier" })
  @ApiOkResponse({ type: BetResponseDto })
  async cashout(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BetResponseDto> {
    const bet = await this.cashOut.execute(user.playerId);
    return BetResponseDto.fromDomain(bet);
  }
}

function parsePagination(
  page?: string,
  limit?: string,
): { p: number; l: number } {
  const p = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const l = Math.min(100, Math.max(1, Number.parseInt(limit ?? "20", 10) || 20));
  return { p, l };
}
