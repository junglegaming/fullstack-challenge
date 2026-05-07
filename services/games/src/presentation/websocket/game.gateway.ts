import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RoundStartedDto } from '../dtos/round-started.dto';
import { MultiplierUpdateDto } from '../dtos/multiplier-update.dto';
import { RoundCrashedDto } from '../dtos/round-crashed.dto';
import { BetPlacedDto } from '../dtos/bet-placed.dto';
import { BetCashedOutDto } from '../dtos/bet-cashed-out.dto';
import type { IWebSocketEmitter } from '@/application/ports/websocket-emitter.port';

@WebSocketGateway({
  cors: true,
  path: '/ws/game',
})
export class GameGateway implements OnGatewayInit, IWebSocketEmitter {
  @WebSocketServer()
  server!: Server;

  afterInit(): void {
    console.log('Game WebSocket Gateway initialized');
  }

  broadcastRoundStarted(dto: RoundStartedDto): void {
    this.server.emit('round:started', {
      roundId: dto.roundId,
      status: dto.status,
      crashPoint: dto.crashPoint,
      startedAt: dto.startedAt,
    });
  }

  broadcastMultiplierUpdate(dto: MultiplierUpdateDto): void {
    this.server.emit('round:multiplier_update', {
      roundId: dto.roundId,
      multiplier: dto.multiplier,
      elapsedMs: dto.elapsedMs,
    });
  }

  broadcastRoundCrashed(dto: RoundCrashedDto): void {
    this.server.emit('round:crashed', {
      roundId: dto.roundId,
      crashPoint: dto.crashPoint,
      crashedAt: dto.crashedAt,
    });
  }

  broadcastBetPlaced(dto: BetPlacedDto): void {
    this.server.emit('bet:placed', {
      roundId: dto.roundId,
      betId: dto.betId,
      playerId: dto.playerId,
      amountCents: Number(dto.amountCents),
    });
  }

  broadcastBetCashedOut(dto: BetCashedOutDto): void {
    this.server.emit('bet:cashed_out', {
      roundId: dto.roundId,
      betId: dto.betId,
      playerId: dto.playerId,
      multiplier: dto.multiplier,
      payoutCents: Number(dto.payoutCents),
    });
  }

  emitToClient(clientId: string, event: string, data: Record<string, unknown>): void {
    this.server.to(clientId).emit(event, data);
  }

  broadcastToAll(event: string, data: Record<string, unknown>): void {
    this.server.emit(event, data);
  }
}
