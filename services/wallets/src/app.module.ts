import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { Money } from "./domain/value-objects/money";
import { CreateWalletUseCase } from "./application/use-cases/create-wallet.use-case";
import { GetWalletByPlayerUseCase } from "./application/use-cases/get-wallet-by-player.use-case";
import { HandleWalletDebitRequestedUseCase } from "./application/use-cases/handle-wallet-debit-requested.use-case";
import { InternalCreditWalletUseCase } from "./application/use-cases/internal-credit-wallet.use-case";
import { InternalDebitWalletUseCase } from "./application/use-cases/internal-debit-wallet.use-case";
import { WALLET_REPOSITORY, type WalletRepository } from "./application/ports/wallet.repository";
import { WALLET_EVENT_PUBLISHER } from "./application/ports/wallet-event.publisher";
import {
  GAMES_RMQ_CLIENT,
  getGamesQueueName,
  getRabbitMqUrl,
} from "./infrastructure/messaging/rabbitmq.constants";
import { RabbitMqWalletEventPublisher } from "./infrastructure/messaging/rabbitmq-wallet-event.publisher";
import { PrismaService } from "./infrastructure/persistence/prisma/prisma.service";
import { PrismaWalletRepository } from "./infrastructure/persistence/prisma/repositories/prisma-wallet.repository";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { WalletDebitRequestedConsumer } from "./presentation/messaging/wallet-debit-requested.consumer";

function resolveInitialBalance(): Money {
  const rawValue = process.env.WALLET_INITIAL_BALANCE_CENTS ?? "100000";
  return Money.fromCentsString(rawValue);
}

@Module({
  imports: [
    ClientsModule.register([
      {
        name: GAMES_RMQ_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [getRabbitMqUrl()],
          queue: getGamesQueueName(),
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [WalletsController, WalletDebitRequestedConsumer],
  providers: [
    PrismaService,
    RabbitMqWalletEventPublisher,
    {
      provide: WALLET_REPOSITORY,
      useClass: PrismaWalletRepository,
    },
    {
      provide: WALLET_EVENT_PUBLISHER,
      useExisting: RabbitMqWalletEventPublisher,
    },
    {
      provide: CreateWalletUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: WalletRepository) =>
        new CreateWalletUseCase(walletRepository, resolveInitialBalance()),
    },
    {
      provide: GetWalletByPlayerUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: WalletRepository) =>
        new GetWalletByPlayerUseCase(walletRepository),
    },
    {
      provide: InternalDebitWalletUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: WalletRepository) =>
        new InternalDebitWalletUseCase(walletRepository),
    },
    {
      provide: InternalCreditWalletUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: WalletRepository) =>
        new InternalCreditWalletUseCase(walletRepository),
    },
    {
      provide: HandleWalletDebitRequestedUseCase,
      inject: [InternalDebitWalletUseCase, WALLET_EVENT_PUBLISHER],
      useFactory: (
        debitWalletUseCase: InternalDebitWalletUseCase,
        walletEventPublisher: RabbitMqWalletEventPublisher,
      ) => new HandleWalletDebitRequestedUseCase(
        debitWalletUseCase,
        walletEventPublisher,
      ),
    },
  ],
})
export class AppModule {}
