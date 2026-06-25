import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ID_GENERATOR } from "./application/ports/id-generator";
import { WALLET_REPOSITORY } from "./application/ports/wallet.repository";
import { CreditWalletUseCase } from "./application/use-cases/credit-wallet.use-case";
import { DebitWalletUseCase } from "./application/use-cases/debit-wallet.use-case";
import { GetOrCreateWalletUseCase } from "./application/use-cases/get-or-create-wallet.use-case";
import { KeycloakJwtGuard } from "./infrastructure/auth/keycloak-jwt.guard";
import { AmqpService } from "./infrastructure/messaging/amqp.service";
import { WalletCommandConsumer } from "./infrastructure/messaging/wallet-command.consumer";
import { DatabaseModule } from "./infrastructure/persistence/database.module";
import { TypeOrmWalletRepository } from "./infrastructure/persistence/typeorm-wallet.repository";
import { UuidGenerator } from "./infrastructure/persistence/uuid.generator";
import { HealthController } from "./presentation/controllers/health.controller";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
  controllers: [HealthController, WalletsController],
  providers: [
    AmqpService,
    KeycloakJwtGuard,
    GetOrCreateWalletUseCase,
    DebitWalletUseCase,
    CreditWalletUseCase,
    WalletCommandConsumer,
    { provide: WALLET_REPOSITORY, useClass: TypeOrmWalletRepository },
    { provide: ID_GENERATOR, useClass: UuidGenerator },
  ],
})
export class AppModule {}
