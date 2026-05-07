import { OnModuleInit } from '@nestjs/common';
import { GameEngine } from '../../application/game.engine';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GameGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  // 1. O NestJS injeta a Engine aqui com todas as dependências dela (RabbitMQ, etc)
  constructor(private readonly engine: GameEngine) {}

  onModuleInit() {
    // 2. Não usamos o 'new'. Usamos a instância que o Nest injetou.
    this.engine.start();
  }

  emitRoundStarted(roundId: string) {
    this.server.emit('round_started', { roundId });
  }

  emitMultiplier(multiplier: number) {
    this.server.emit('multiplier_update', { multiplier: multiplier.toFixed(2) });
  }

  emitCrash(multiplier: number) {
    this.server.emit('round_crashed', { multiplier: multiplier.toFixed(2) });
  }
}