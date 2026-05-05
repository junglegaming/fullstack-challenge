import { GenericContainer, Wait } from 'testcontainers';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMqContainer } from '@testcontainers/rabbitmq';
import { AppModule } from '../../../src/app.module';
import { NestFactory } from '@nestjs/core';
import { NestApplication } from '@nestjs/common';
import { GameLoopService } from '../../../src/infrastructure/services/game-loop.service';

let postgresContainer: PostgreSqlContainer;
let rabbitMqContainer: RabbitMqContainer;
let app: NestApplication;
let port: number;

export async function setupE2E(): Promise<{
  port: number;
  app: NestApplication;
  rabbitMqUrl: string;
}> {
  // Start PostgreSQL
  postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('game_e2e')
    .start();

  // Start RabbitMQ
  rabbitMqContainer = await new RabbitMqContainer('rabbitmq:3-management-alpine')
    .withExposedPorts(5672)
    .waitFor(Wait.forLogMessage('Server startup complete'))
    .start();

  const rabbitMqUrl = `amqp://${rabbitMqContainer.getHost()}:${rabbitMqContainer.getMappedPort(5672)}`;

  // Set environment variables
  process.env.DATABASE_URL = postgresContainer.getConnectionUri();
  process.env.RABBITMQ_URL = rabbitMqUrl;
  process.env.PORT = '0'; // Random port

  // Create and init NestJS app
  app = await NestFactory.create(AppModule);
  await app.init();
  port = (app.getHttpServer()).address().port;

  // Start game loop
  const gameLoop = app.get(GameLoopService);
  await gameLoop.startLoop();

  return { port, app, rabbitMqUrl };
}

export async function teardownE2E(): Promise<void> {
  if (app) {
    await app.close();
  }
  if (postgresContainer) {
    await postgresContainer.stop();
  }
  if (rabbitMqContainer) {
    await rabbitMqContainer.stop();
  }
}

export function getApp(): NestApplication {
  return app;
}

export function getPort(): number {
  return port;
}
