import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards, Headers as NestHeaders, BadRequestException } from "@nestjs/common";
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

@Post('bet')
@UseGuards(JwtAuthGuard)
async placeBet(
  @Req() req: any, 
  @Body() body: { amount: string }, 
  @NestHeaders('authorization') token: string
) {
  console.log('Body recebido:', body);

  if (!body || !body.amount) {
    throw new BadRequestException('O campo amount é obrigatório no corpo da requisição');
  }

  const amount = BigInt(body.amount);
  const playerId = req.user.sub;

  return this.placeBetUseCase.execute(playerId, amount, token);
}

  @UseGuards(JwtAuthGuard)
  @Post('bet/cashout')
  async cashout(@Req() req: any) {
    const playerId = req.user.sub

    return this.cashoutUseCase.execute(
      playerId,
    )
  }

  @UseGuards(JwtAuthGuard)
  @Get('rounds/:id/verify')
async verify(@Param('id') id: string) {
  const round = await this.roundService.getRoundById(id);

  const isFinished = !['BETTING', 'IN_PROGRESS'].includes(round.status);

  if (!round) {
    throw new NotFoundException('Rodada não encontrada no histórico.');
  }

  return {
    game: 'Crash',
    roundId: round.id,
    mathematics: {
      crashPoint: isFinished ? round.crashPoint :  "REVEALED_AFTER_CRASH",
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      combinedHashCheck: "SHA256(serverSeed) === serverSeedHash"
    },
    status: round.status,
    timestamp: round.createdAt
  };
}
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory() {
    try {
      const history = await this.roundService.getHistory();
      
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar histórico de rodadas',
      };
    }
  }
}



