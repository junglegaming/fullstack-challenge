import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server } from "socket.io";
import type { GameRealtimePublisher } from "../../application/ports/game-realtime.publisher";
import {
  BET_ACCEPTED,
  BET_CASHED_OUT,
  ROUND_BETTING_STARTED,
  ROUND_CRASHED,
  ROUND_MULTIPLIER_TICK,
  ROUND_SETTLED,
  ROUND_STARTED,
  type BetAcceptedPayload,
  type BetCashedOutPayload,
  type RoundBettingStartedPayload,
  type RoundCrashedPayload,
  type RoundMultiplierTickPayload,
  type RoundSettledPayload,
  type RoundStartedPayload,
} from "../../application/realtime/game-realtime-events";

@Injectable()
@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "games",
})
export class GameRealtimeGateway implements GameRealtimePublisher {
  @WebSocketServer()
  private readonly server?: Server;

  async publishRoundBettingStarted(
    payload: RoundBettingStartedPayload,
  ): Promise<void> {
    this.emit(ROUND_BETTING_STARTED, payload);
  }

  async publishRoundStarted(payload: RoundStartedPayload): Promise<void> {
    this.emit(ROUND_STARTED, payload);
  }

  async publishRoundMultiplierTick(
    payload: RoundMultiplierTickPayload,
  ): Promise<void> {
    this.emit(ROUND_MULTIPLIER_TICK, payload);
  }

  async publishBetAccepted(payload: BetAcceptedPayload): Promise<void> {
    this.emit(BET_ACCEPTED, payload);
  }

  async publishBetCashedOut(payload: BetCashedOutPayload): Promise<void> {
    this.emit(BET_CASHED_OUT, payload);
  }

  async publishRoundCrashed(payload: RoundCrashedPayload): Promise<void> {
    this.emit(ROUND_CRASHED, payload);
  }

  async publishRoundSettled(payload: RoundSettledPayload): Promise<void> {
    this.emit(ROUND_SETTLED, payload);
  }

  private emit<T>(event: string, payload: T): void {
    this.server?.emit(event, payload);
  }
}
