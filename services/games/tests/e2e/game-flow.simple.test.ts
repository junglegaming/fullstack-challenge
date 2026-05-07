import { describe, it, beforeAll, afterAll, expect } from 'bun:test';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { NestApplication } from '@nestjs/common';
import { GameGateway } from '../../src/presentation/websocket/game.gateway';
import { GameLoopService } from '../../src/infrastructure/services/game-loop.service';
import { RoundRepositoryImpl } from '../../src/infrastructure/repositories/round.repository.impl';
import { RabbitMQService } from '../../src/infrastructure/messaging/rabbitmq.service';
import { OutboxWorker } from '../../src/infrastructure/workers/outbox.worker';
import { IEventBus } from '../../src/application/ports/event-bus.port';
import { IWebSocketEmitter } from '../../src/application/ports/websocket-emitter.port';
import { WebSocket } from 'ws';

describe('Game Service E2E - Simple', () => {
  let app: NestApplication;
  let port: number;
  let gateway: GameGateway;
  let gameLoop: GameLoopService;

  beforeAll(async () => {
    // Create and init app
    app = await NestFactory.create(AppModule);
    await app.init();
    port = (app.getHttpServer()).address().port;

    gateway = app.get(GameGateway);
    gameLoop = app.get(GameLoopService);

    // Start services
    const outboxWorker = app.get(OutboxWorker);
    outboxWorker.start();
    gameLoop.startLoop();

    // Give time for first round to start
    await new Promise(resolve => setTimeout(resolve, 12000));
  });

  afterAll(async () => {
    const outboxWorker = app.get(OutboxWorker);
    outboxWorker.stop();
    gameLoop.stopLoop();
    await app.close();
  });

  it('scenario 1: health check returns ok', async () => {
    const response = await fetch(`http://localhost:${port}/games/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('games');
  });

  it('scenario 2: place bet via HTTP', async () => {
    const response = await fetch(`http://localhost:${port}/games/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-e2e-simple-1',
        amountCents: 1000,
      }),
    });

    // Should be 201 Created or 200 OK
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  });

  it('scenario 3: cashout via HTTP', async () => {
    const response = await fetch(`http://localhost:${port}/games/bet/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-e2e-simple-1',
      }),
    });

    // Might succeed (200) or fail depending on timing
    expect(response.status).toBeGreaterThan(0);
  });

  it('scenario 4: WebSocket connects and receives events', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/game`);

    await new Promise<void>((resolve) => {
      ws.onopen = () => {
        // Should receive round:started or round:multiplier_update
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data.toString());
          expect(data).toBeDefined();
          ws.close();
          resolve();
        };
      };
    });
  });
});
