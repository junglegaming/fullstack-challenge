import { OnModuleInit } from '@nestjs/common';
import { GameEngine } from '../../application/game.engine'; // Importamos a interface também
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IGameEmitter } from '../../application/interfaces/game-emitter.interface';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnModuleInit, IGameEmitter {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly engine: GameEngine) {}

  onModuleInit() {
    // Aqui fazemos a conexão: a Engine recebe o Gateway como seu "emissor"
    this.engine.setEmitter(this);
    this.engine.start();
  }

  emitRoundStarted(roundId: string) {
    this.server?.emit('round_started', { roundId });
  }

  emitMultiplier(multiplier: number) {
    this.server?.emit('multiplier_update', { multiplier: multiplier.toFixed(2) });
  }

  emitCrash(multiplier: number) {
    this.server?.emit('round_crashed', { multiplier: multiplier.toFixed(2) });
  }
}