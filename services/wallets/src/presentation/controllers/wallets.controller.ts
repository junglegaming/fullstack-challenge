import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { GetUser } from "../decorators/get-user.decorator";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { CreateWalletUseCase } from "@/application/commands/create-wallet.usecase";
import { GetWalletUseCase } from "@/application/queries/get-wallet.usecase";
import { CreateWalletResponseDto } from "../dtos/create-wallet.response.dto";
import { WalletBalanceResponseDto } from "../dtos/wallet-balance.response.dto";
import { PlayerId } from "@/domain/value-objects/player-id.vo";
import { Money } from "@/domain/value-objects/money.vo";

@ApiTags("wallets")
@Controller("wallets")
export class WalletsController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase,
  ) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiResponse({ status: 200, description: "Service is healthy", type: HealthCheckResponseDto })
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create wallet for authenticated player" })
  @ApiResponse({ status: 201, description: "Wallet created successfully", type: CreateWalletResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Wallet already exists" })
  async createWallet(
    @GetUser() user: { userId: string; email: string; username: string },
  ): Promise<CreateWalletResponseDto> {
    const playerId = new PlayerId(user.userId);
    const initialBalance = new Money(0n);

    const result = await this.createWalletUseCase.execute({
      playerId,
      initialBalance,
    });

    return new CreateWalletResponseDto(
      result.walletId,
      result.playerId,
      Number(result.balanceCents),
      new Date(),
    );
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get wallet balance for authenticated player" })
  @ApiResponse({ status: 200, description: "Wallet found", type: WalletBalanceResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Wallet not found" })
  async getMyWallet(
    @GetUser() user: { userId: string; email: string; username: string },
  ): Promise<WalletBalanceResponseDto> {
    const result = await this.getWalletUseCase.execute({
      playerId: user.userId,
    });

    return new WalletBalanceResponseDto(
      result.walletId,
      result.playerId,
      Number(result.balanceCents),
      new Date(),
    );
  }
}
