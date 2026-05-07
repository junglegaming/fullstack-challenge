import { Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { PlaceBetUseCase } from "../../application/usecases/place-bet.usecase";
import { CashoutUseCase } from "../../application/usecases/cashout.usecase";
import { JwtAuthGuard } from "@crash/auth";
import { RoundService } from "../../application/service/round.service";

@Controller('games')
export class GamesController {

   constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashoutUseCase: CashoutUseCase,
    private readonly roundService: RoundService,
  ) {}
  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }
  @UseGuards(JwtAuthGuard)
  @Post('bet')
  async placeBet(@Req() req: any) {
    const playerId = req.user.sub

    return this.placeBetUseCase.execute(
      playerId,
      1000n,
    )
  }

  @UseGuards(JwtAuthGuard)
  @Post('bet/cashout')
  async cashout(@Req() req: any) {
    const playerId = req.user.sub

    return this.cashoutUseCase.execute(
      playerId,
    )
  }

  @Get('rounds/:id/verify')
async verify(@Param('id') id: string) {
  // 1. Busca a rodada no seu banco ou service
  const round = await this.roundService.getRoundById(id);

  if (!round) {
    throw new NotFoundException('Rodada não encontrada no histórico.');
  }

  // 2. Retorna os dados para a "prova real"
  return {
    game: 'Crash',
    roundId: round.id,
    mathematics: {
      crashPoint: round.crashPoint,
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      combinedHashCheck: "SHA256(serverSeed) === serverSeedHash"
    },
    status: round.status,
    timestamp: round.createdAt
  };
}


}
