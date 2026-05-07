import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { PlaceBetUseCase } from "../../application/usecases/place-bet.usecase";
import { CashoutUseCase } from "../../application/usecases/cashout.usecase";
import { JwtAuthGuard } from "@crash/auth";

@Controller('games')
export class GamesController {

   constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashoutUseCase: CashoutUseCase,
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


}
