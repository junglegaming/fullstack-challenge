import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { getRabbitMqUrl, getWalletQueueName } from "./infrastructure/messaging/rabbitmq.constants";
import { DomainExceptionFilter } from "./presentation/filters/domain-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DomainExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Crash Game — Wallets API")
    .setDescription("Wallets service REST API for balance and wallet management")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [getRabbitMqUrl()],
      queue: getWalletQueueName(),
      queueOptions: { durable: true },
    },
  });

  const port = process.env.PORT ?? "4002";
  await app.startAllMicroservices();
  await app.listen(port, "0.0.0.0");
  console.log(`Wallets service running on port ${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/docs`);
}

bootstrap();
