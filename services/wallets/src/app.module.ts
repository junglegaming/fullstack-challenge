import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import mikroOrmConfig from "./infrastructure/persistence/mikro-orm.config";
import { WalletEntity } from "./infrastructure/persistence/entities/orm/wallet.entity";
import { TransactionEntity } from "./infrastructure/persistence/entities/orm/transaction.entity";
import { InboxEventEntity } from "./infrastructure/persistence/entities/orm/inbox-event.orm-entity";
import { OutboxEventEntity } from "./infrastructure/persistence/entities/orm/outbox-event.orm-entity";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { JwtAuthGuard } from "./presentation/guards/jwt-auth.guard";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { RabbitMQService } from "./infrastructure/rabbitmq/rabbitmq.service";
import { WalletEventHandlerService } from "./application/event-handlers/wallet-event-handler.service";
import { OutboxPublisherService } from "./infrastructure/outbox-publisher.service";
import { ProcessDebitUseCase } from "./application/commands/process-debit.usecase";
import { ProcessCreditUseCase } from "./application/commands/process-credit.usecase";
import { CreateWalletUseCase } from "./application/commands/create-wallet.usecase";
import { GetWalletUseCase } from "./application/queries/get-wallet.usecase";
import { MikroOrmWalletRepository } from "./infrastructure/persistence/repositories/mikro-orm-wallet.repository";
import { MikroOrmInboxRepository } from "./infrastructure/persistence/repositories/mikro-orm-inbox.repository";
import { MikroOrmOutboxRepository } from "./infrastructure/persistence/repositories/mikro-orm-outbox.repository";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    MikroOrmModule.forFeature([WalletEntity, TransactionEntity, InboxEventEntity, OutboxEventEntity]),
  ],
  controllers: [WalletsController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    RabbitMQService,
    WalletEventHandlerService,
    OutboxPublisherService,
    ProcessDebitUseCase,
    ProcessCreditUseCase,
    CreateWalletUseCase,
    GetWalletUseCase,
    {
      provide: 'IWalletRepository',
      useClass: MikroOrmWalletRepository,
    },
    {
      provide: 'IInboxRepository',
      useClass: MikroOrmInboxRepository,
    },
    {
      provide: 'IOutboxRepository',
      useClass: MikroOrmOutboxRepository,
    },
  ],
})
export class AppModule {}
