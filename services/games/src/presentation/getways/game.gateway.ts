import { OnModuleInit } from '@nestjs/common';
import { GameEngine } from '../../application/game.engine';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IGameEmitter } from '../../application/interfaces/game-emitter.interface';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnModuleInit, IGameEmitter {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly engine: GameEngine) {}

  onModuleInit() {
    try {
      this.engine.setEmitter(this);
      this.engine.start();
    } catch (err) {
      console.error('❌ RT-LOG: Erro ao iniciar Gateway:', err);
    }
  }

  emitBettingStarted() {
    this.server.emit('betting_started');
  }

  emitRoundStarted(roundId: string, hash: string) {
    this.server.emit('events', {
      type: 'round_started',
      payload: { roundId, hash }
    });
  }

  emitMultiplier(multiplier: number) {
    this.server?.emit('multiplier_update', { multiplier: multiplier.toFixed(2) });
  }

  emitCrash(multiplier: number) {
    this.server?.emit('round_crashed', { crashPoint: multiplier.toFixed(2) });
  }

  // 💡 ADICIONE DAQUI PARA BAIXO:

  emitBetPlaced(playerId: string, amount: bigint) {
    this.server?.emit('bet_placed', { 
      playerId, 
      amount: amount.toString() // Evita o erro de serialização do BigInt
    });
  }

  emitCashoutDone(playerId: string, profit: bigint) {
    this.server?.emit('cashout_done', { 
      playerId, 
      profit: profit.toString() // Evita o erro de serialização do BigInt
    });
  }

  
}