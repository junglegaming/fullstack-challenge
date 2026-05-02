import { RoundRepository } from "@/infrastructure/repositories/round.repository";
import { GameGateway } from "@/presentation/websocket/game.gateway";

export class RunRoundUseCase {
  constructor(
    private roundRepo: RoundRepository,
    private gateway: GameGateway,
  ) {}

  async execute() {
    let round = await this.roundRepo.getCurrent();

    // esperar fase de apostas
    await sleep(10000);

    round.start();
    await this.roundRepo.save(round);

    let time = 0;

    const interval = setInterval(async () => {
      time += 0.1;

      const multiplier = Math.exp(0.1 * time);

      round.updateMultiplier(multiplier);

      this.gateway.emitMultiplier(multiplier);

      if (multiplier >= round.crashPoint) {
        clearInterval(interval);

        round.crash();
        await this.roundRepo.save(round);

        this.gateway.emitCrash(round.crashPoint);

        // inicia nova rodada
        await this.execute();
      }
    }, 100);
  }
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}