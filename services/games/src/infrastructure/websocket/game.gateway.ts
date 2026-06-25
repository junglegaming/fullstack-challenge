import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { GameEvent } from "../../application/events/game-events";
import type { GameEventsPublisher } from "../../application/ports/game-events.publisher";

@WebSocketGateway({ cors: { origin: "*" } })
export class GameGateway
  implements GameEventsPublisher, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  private server!: Server;

  publish(event: GameEvent): void {

    if (!this.server) {
      return;
    }

    this.server.emit(event.type, event);
    this.server.emit("game.event", event);
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }
}
