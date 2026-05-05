import { Module } from "@nestjs/common";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { RabbitMQService } from "./infrastructure/rabbitmq/rabbitmq.service";
import { WalletEventHandlerService } from "./application/event-handlers/wallet-event-handler.service";
import { ProcessDebitUseCase } from "./application/commands/process-debit.usecase";
import { ProcessCreditUseCase } from "./application/commands/process-credit.usecase";
import { CreateWalletUseCase } from "./application/commands/create-wallet.usecase";
import { GetWalletUseCase } from "./application/queries/get-wallet.usecase";
import { MockWalletRepository } from "./infrastructure/repositories/mock-wallet.repository";

@Module({
  controllers: [WalletsController],
  providers: [
    RabbitMQService,
    WalletEventHandlerService,
    ProcessDebitUseCase,
    ProcessCreditUseCase,
    CreateWalletUseCase,
    GetWalletUseCase,
    {
      provide: 'IWalletRepository',
      useClass: MockWalletRepository,
    },
  ],
})
export class AppModule {}
