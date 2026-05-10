import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Inject, forwardRef } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { CrashRoundUseCase } from "@/application/use-cases/crash-round.use-case";
import { CreateRoundUseCase } from "@/application/use-cases/create-round.use-case";
import { IRoundRepository } from "@/domain/repositories/IRoundRepository";
import { Round } from "@/domain/entities/Round";
import * as crypto from "crypto";
import { GetRoundStatisticsUseCase } from "@/application/use-cases/get-round-statistics.use-case";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private gameLoop: NodeJS.Timeout | null = null;
  private timerLoop: NodeJS.Timeout | null = null;
  private bettingTimer = 50;
  private isCrashing = false;

  constructor(
    @Inject(forwardRef(() => CrashRoundUseCase))
    private readonly crashRoundUseCase: CrashRoundUseCase,
    @Inject(forwardRef(() => CreateRoundUseCase))
    private readonly createRoundUseCase: CreateRoundUseCase,
    private readonly roundRepository: IRoundRepository,
    private readonly getRoundStatisticsUseCase: GetRoundStatisticsUseCase,
  ) {}

  private async createInitialRound() {
    try {
      let round = await this.roundRepository.findActiveRound();
      if (!round) {
        const clientSeed = crypto.randomBytes(16).toString("hex");
        await this.createRoundUseCase.execute(clientSeed);
      }
    } catch (err) {
      console.error("Erro ao criar rodada inicial:", err);
    }
  }

  async afterInit() {
    await this.createInitialRound();
    this.start();
  }

  async handleConnection(client: Socket) {
    try {
      const round = await this.roundRepository.findActiveRound();
      client.emit("betting_timer", {
        secondsLeft: this.bettingTimer,
        status: round?.status || "BETTING",
      });
    } catch (err) {
      console.error("Erro ao conectar:", err);
    }
  }

  handleDisconnect(_client: Socket) {}

  private start() {
    this.timerLoop = setInterval(() => {
      this.bettingTimer--;
      this.server.emit("betting_timer", { secondsLeft: this.bettingTimer });

      if (this.bettingTimer <= 0) {
        this.transitionToRunning();
      }
    }, 1000);

    this.gameLoop = setInterval(async () => {
      try {
        const round = await this.roundRepository.findActiveRound();
        if (!round) return;

        if (round.status === "RUNNING") {
          const multiplier = round.getCurrentMultiplier().toDecimal();

          this.server.emit("multiplier_update", {
            multiplier: multiplier.toFixed(2),
          });

          const sockets = await this.server.fetchSockets();
          await Promise.all(
            sockets.map(async (socket) => {
              const userId = socket.data.userId;
              const stats = await this.getRoundStats(userId);
              socket.emit("user_stats_update", {
                totalBets: stats.totalAmount,
              });
            }),
          );

          if (multiplier >= round.crashPoint) {
            await this.executeCrash(round);
          }
        }
      } catch (err) {
        console.error("Erro no game loop:", err);
      }
    }, 100);
  }

  private async transitionToRunning() {
    try {
      const round = await this.roundRepository.findActiveRound();

      if (!round || round.status !== "BETTING") {
        return;
      }

      round.startRound();
      await this.roundRepository.saveRound(round);

      this.server.emit("round_started", {
        roundId: round.id,
        serverSeedHash: round.getPublicSeedInfo().serverSeedHash,
        status: "RUNNING",
      });
    } catch (err) {
      console.error("Erro ao transicionar:", err);
    }
  }

  private async executeCrash(round: Round) {
    if (this.isCrashing) return;
    this.isCrashing = true;

    try {
      await this.crashRoundUseCase.execute();
      this.server.emit("game_crash", {
        crashPoint: round.crashPoint.toFixed(2),
        roundId: round.id,
        status: "CRASHED",
      });
    } catch (err) {
      console.error("Erro ao crashar:", err);
    }

    this.resetRound();
  }

  private resetRound() {
    this.bettingTimer = 50;
    this.isCrashing = false;

    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.timerLoop) clearInterval(this.timerLoop);
    this.gameLoop = null;
    this.timerLoop = null;

    setTimeout(async () => {
      await this.createInitialRound();
      this.start();
    }, 5000);
  }

  private async getRoundStats(userId: string) {
    const stats = await this.getRoundStatisticsUseCase.execute({
      userId,
    });

    return stats.toJSON();
  }
}
