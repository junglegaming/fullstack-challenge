import { OnModuleInit } from '@nestjs/common';
import { GameEngine } from '../../application/game.engine';
import { WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GameGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  onModuleInit() {
    // Instancia a engine e passa este gateway para ela
    const engine = new GameEngine(this);
    engine.start();
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