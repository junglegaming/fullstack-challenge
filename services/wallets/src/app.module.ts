import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        synchronize: false,
        migrationsRun: true,
        entities: [],
        migrations: [],
    })
  ],
  controllers: [WalletsController],
})
export class AppModule {}
