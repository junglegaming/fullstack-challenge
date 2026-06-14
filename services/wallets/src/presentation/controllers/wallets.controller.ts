import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CreateWalletUseCase } from "../../application/use-cases/create-wallet.use-case";
import { GetWalletByPlayerUseCase } from "../../application/use-cases/get-wallet-by-player.use-case";
import { PlayerId } from "../../domain/value-objects/player-id";
import { CurrentPlayer } from "../auth/current-player.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { toWalletResponseDto, WalletResponseDto } from "../dtos/wallet-response.dto";

@Controller()
export class WalletsController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletByPlayerUseCase: GetWalletByPlayerUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post("wallets")
  @UseGuards(JwtAuthGuard)
  async createWallet(@CurrentPlayer() playerId: string): Promise<WalletResponseDto> {
    const result = await this.createWalletUseCase.execute(PlayerId.create(playerId));
    return toWalletResponseDto(result.wallet);
  }

  @Get("wallets/me")
  @UseGuards(JwtAuthGuard)
  async getMyWallet(@CurrentPlayer() playerId: string): Promise<WalletResponseDto> {
    const result = await this.getWalletByPlayerUseCase.execute(PlayerId.create(playerId));
    return toWalletResponseDto(result.wallet);
  }
}
