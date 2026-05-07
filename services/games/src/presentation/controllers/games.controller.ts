import { Controller, Get, Post } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { PlaceBetUseCase } from "../../application/usecases/place-bet.usecase";
import { CashoutUseCase } from "../../application/usecases/cashout.usecase";

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

   @Post('bet')
  async placeBet() {
    const playerId = 'test-player'

    return this.placeBetUseCase.execute(
      playerId,
      1000n,
    )
  }

  @Post('bet/cashout')
  async cashout() {
    const playerId = 'test-player'

    return this.cashoutUseCase.execute(
      playerId,
    )
  }


}
