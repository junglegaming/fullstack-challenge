import { Controller, Get, Post, Req, Body } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { PlaceBetUseCase } from "@/application/use-cases/place-bet.usecase";
import { CashoutUseCase } from "@/application/use-cases/cashout.usecase";

@Controller('games')
export class GamesController {
  constructor(
    private placeBet: PlaceBetUseCase,
    private cashout: CashoutUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Post('bet')
  bet(@Req() req: Request, @Body() body: Body) {
    return this.placeBet.execute(req.user.id, body.amount);
  }

  @Post('bet/cashout')
  cashoutBet(@Req() req: Request) {
    return this.cashout.execute(req.user.id);
  }
}
