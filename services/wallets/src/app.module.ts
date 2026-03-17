import { Module } from "@nestjs/common";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  controllers: [WalletsController],
})
export class AppModule {}
