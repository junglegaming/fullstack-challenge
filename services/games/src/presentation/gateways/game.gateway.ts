import { Injectable } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server } from "socket.io";
import type { BetStatus } from "../../domain/bet";

export interface BetSummary {
  playerId: string;
  amountCents: number;
  status: BetStatus;
  payoutCents: number | null;
}

@Injectable()
@WebSocketGateway({ cors: { origin: "*" } })
export class GameGateway {
  @WebSocketServer()
  private server!: Server;

  emitRoundBetting(roundId: string, hash: string, bettingEndsAt: Date): void {
    this.server.emit("round.betting", { roundId, hash, bettingEndsAt });
  }

  emitRoundStarted(roundId: string, startedAt: Date): void {
    this.server.emit("round.started", { roundId, startedAt });
  }

  emitMultiplierTick(roundId: string, multiplier: number, elapsedMs: number): void {
    this.server.emit("multiplier.tick", { roundId, multiplier, elapsedMs });
  }

  emitRoundCrashed(roundId: string, crashPoint: number, seed: string, bets: BetSummary[]): void {
    this.server.emit("round.crashed", { roundId, crashPoint, seed, bets });
  }

  emitBetPlaced(roundId: string, playerId: string, amountCents: number): void {
    this.server.emit("bet.placed", { roundId, playerId, amountCents });
  }

  emitBetCashedOut(
    roundId: string,
    playerId: string,
    multiplier: number,
    payoutCents: number,
  ): void {
    this.server.emit("bet.cashed_out", { roundId, playerId, multiplier, payoutCents });
  }

  emitSettled(playerId: string, availableBalanceCents: number): void {
    this.server.emit("settled", { playerId, availableBalanceCents });
  }
}
