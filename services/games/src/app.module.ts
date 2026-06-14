import { Module } from "@nestjs/common";
import { GetRoundVerificationUseCase } from "./application/use-cases/get-round-verification.use-case";
import { ProvablyFairService } from "./domain/services/provably-fair.service";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  controllers: [GamesController],
  providers: [
    ProvablyFairService,
    {
      provide: GetRoundVerificationUseCase,
      inject: [ProvablyFairService],
      useFactory: (provablyFairService: ProvablyFairService) =>
        new GetRoundVerificationUseCase(provablyFairService),
    },
  ],
})
export class AppModule {}
