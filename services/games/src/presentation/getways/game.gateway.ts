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

  onModuleInit() {;
  
  try {
    this.engine.setEmitter(this);
    this.engine.start();
  } catch (err) {
    console.error('❌ RT-LOG: Erro ao iniciar Gateway:', err);
  }
}

  emitRoundStarted(roundId: string, hash: string) {
  this.server.emit('events', {
    type: 'ROUND_STARTED',
    payload: { roundId, hash }
  });
}

  emitMultiplier(multiplier: number) {
    this.server?.emit('multiplier_update', { multiplier: multiplier.toFixed(2) });
  }

  emitCrash(multiplier: number, serverSeed: string) {
  this.server?.emit('round_crashed', {
    crashPoint: multiplier.toFixed(2),
    serverSeed,
  })
}
}