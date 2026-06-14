import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { getGamesQueueName, getRabbitMqUrl } from "./infrastructure/messaging/rabbitmq.constants";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [getRabbitMqUrl()],
      queue: getGamesQueueName(),
      queueOptions: { durable: true },
    },
  });

  const port = process.env.PORT ?? 4001;
  await app.startAllMicroservices();
  await app.listen(port, "0.0.0.0");
  console.log(`Games service running on port ${port}`);
}

bootstrap();
