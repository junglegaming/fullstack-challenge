import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  emitMultiplier(value: number) {
    this.server.emit('multiplier:update', { value });
  }

  emitCrash(crashPoint: number) {
    this.server.emit('round:crashed', { crashPoint });
  }
}