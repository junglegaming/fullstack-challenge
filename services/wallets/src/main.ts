import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672"],
      queue: "wallet_queue",
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 4002;
  await app.listen(port, "0.0.0.0");

  console.log(
    `Wallets service running on port ${port} and listening to RabbitMQ...`,
  );
}

bootstrap();
