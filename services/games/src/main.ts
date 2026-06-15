import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { getGamesQueueName, getRabbitMqUrl } from "./infrastructure/messaging/rabbitmq.constants";
import { DomainExceptionFilter } from "./presentation/filters/domain-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DomainExceptionFilter());
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
