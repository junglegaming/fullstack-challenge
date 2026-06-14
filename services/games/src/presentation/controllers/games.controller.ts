import { Controller, Get } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@Controller()
export class GamesController {
  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  // Planned: GET /games/rounds/:roundId/verify
  // Returns RoundVerificationResponseDto via GetRoundVerificationUseCase
}
