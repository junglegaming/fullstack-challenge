import { RoundRepository } from '@/domain/repositories/round.repository';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { getMultiplierAt } from '@/domain/services/multiplier-growth.service';
import { StartRoundUseCase } from '@/application/use-cases/start-round.usecase';
import { CrashRoundUseCase } from '@/application/use-cases/crash-round.usecase';
import { FinishRoundUseCase } from '@/application/use-cases/finish-round.usecase';
import { GameGateway } from '@/presentation/websocket/game.gateway';
import { RoundStartedDto } from '@/presentation/dtos/round-started.dto';
import { MultiplierUpdateDto } from '@/presentation/dtos/multiplier-update.dto';
import { RoundCrashedDto } from '@/presentation/dtos/round-crashed.dto';
import { StartRoundCommand } from '@/application/commands/start-round.command';
import { CrashRoundCommand } from '@/application/commands/crash-round.command';
import { FinishRoundCommand } from '@/application/commands/finish-round.command';
import { RoundStatus } from '@/domain/enums/round-status.enum';

const BETTING_DURATION_MS = 10000;
const MULTIPLIER_INTERVAL_MS = 100;
const MAX_GAME_DURATION_MS = 300000;

export class GameLoopService {
  private isRunning = false;
  private currentTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentInterval: ReturnType<typeof setInterval> | null = null;
  private gameStartTime: number = 0;

  constructor(
    private readonly roundRepo: RoundRepository,
    private readonly startRoundUseCase: StartRoundUseCase,
    private readonly crashRoundUseCase: CrashRoundUseCase,
    private readonly finishRoundUseCase: FinishRoundUseCase,
    private readonly gateway: GameGateway,
  ) {}

  async startLoop(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.runBettingPhase();
  }

  stopLoop(): void {
    this.isRunning = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
  }

  private async runBettingPhase(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const result = await this.startRoundUseCase.execute(new StartRoundCommand());

      const startedDto = new RoundStartedDto(
        result.roundId,
        result.status,
        result.crashPoint,
        new Date().toISOString(),
      );
      this.gateway.broadcastRoundStarted(startedDto);

      this.gameStartTime = Date.now();
      this.currentTimeout = setTimeout(() => {
        this.runRunningPhase();
      }, BETTING_DURATION_MS);
    } catch (error) {
      console.error('Error in betting phase:', error);
      this.scheduleNextRound(5000);
    }
  }

  private async runRunningPhase(): Promise<void> {
    if (!this.isRunning) return;

    let elapsedMs = 0;

    this.currentInterval = setInterval(async () => {
      if (!this.isRunning) {
        if (this.currentInterval) clearInterval(this.currentInterval);
        return;
      }

      try {
        elapsedMs += MULTIPLIER_INTERVAL_MS;
        const multiplier = getMultiplierAt(elapsedMs);
        const round = await this.roundRepo.getCurrent();

        if (round.roundStatus !== RoundStatus.RUNNING) return;

        round.updateMultiplier(new Multiplier(multiplier.raw));
        await this.roundRepo.save(round);

        this.gateway.broadcastMultiplierUpdate(
          new MultiplierUpdateDto(
            round.roundId.raw,
            multiplier.raw,
            elapsedMs,
          ),
        );

        if (multiplier.raw >= round.roundCrashPoint.raw || elapsedMs >= MAX_GAME_DURATION_MS) {
          this.crashGame();
        }
      } catch (error) {
        console.error('Error in running phase:', error);
      }
    }, MULTIPLIER_INTERVAL_MS);
  }

  private async crashGame(): Promise<void> {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }

    if (!this.isRunning) return;

    try {
      const crashResult = await this.crashRoundUseCase.execute(new CrashRoundCommand());

      this.gateway.broadcastRoundCrashed(
        new RoundCrashedDto(
          crashResult.roundId,
          crashResult.crashPoint,
          new Date().toISOString(),
        ),
      );

      await this.finishRoundUseCase.execute(new FinishRoundCommand());

      this.scheduleNextRound(5000);
    } catch (error) {
      console.error('Error crashing game:', error);
      this.scheduleNextRound(5000);
    }
  }

  private scheduleNextRound(delayMs: number): void {
    if (!this.isRunning) return;
    this.currentTimeout = setTimeout(() => {
      this.runBettingPhase();
    }, delayMs);
  }
}
