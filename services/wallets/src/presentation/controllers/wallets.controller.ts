import {
  Controller,
  ConflictException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from "@nestjs/common";
import { CreateWalletUseCase } from "@/application/create-wallet.use-case";
import { GetMyWalletUseCase } from "@/application/get-my-wallet.use-case";
import { WalletAlreadyExistsError, WalletNotFoundError } from "@/domain/errors";
import { Wallet } from "@/domain/wallet";
import { PlayerId } from "../decorators/player-id.decorator";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { WalletResponseDto } from "../dtos/wallet-response.dto";

@Controller()
export class WalletsController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getMyWalletUseCase: GetMyWalletUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@PlayerId() playerId: string): Promise<WalletResponseDto> {
    try {
      const wallet = await this.createWalletUseCase.execute(playerId);
      return this.toDto(wallet);
    } catch (err) {
      if (err instanceof WalletAlreadyExistsError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  @Get("me")
  async getMe(@PlayerId() playerId: string): Promise<WalletResponseDto> {
    try {
      const wallet = await this.getMyWalletUseCase.execute(playerId);
      return this.toDto(wallet);
    } catch (err) {
      if (err instanceof WalletNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  private toDto(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      availableBalance: wallet.availableBalance.cents,
      reservedBalance: wallet.reservedBalance.cents,
    };
  }
}
