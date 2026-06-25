import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { GetOrCreateWalletUseCase } from "../../application/use-cases/get-or-create-wallet.use-case";
import type { AuthenticatedUser } from "../../infrastructure/auth/authenticated-user";
import { CurrentUser } from "../../infrastructure/auth/current-user.decorator";
import { KeycloakJwtGuard } from "../../infrastructure/auth/keycloak-jwt.guard";
import { WalletResponseDto } from "../dtos/wallet-response.dto";

@ApiTags("wallets")
@ApiBearerAuth()
@Controller("wallets")
@UseGuards(KeycloakJwtGuard)
export class WalletsController {
  constructor(private readonly getOrCreateWallet: GetOrCreateWalletUseCase) {}

  @Post()
  @ApiOperation({ summary: "Create (or return) the authenticated player's wallet" })
  @ApiOkResponse({ type: WalletResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WalletResponseDto> {
    const wallet = await this.getOrCreateWallet.execute(user.playerId);
    return WalletResponseDto.fromDomain(wallet);
  }

  @Get("me")
  @ApiOperation({ summary: "Return the authenticated player's wallet and balance" })
  @ApiOkResponse({ type: WalletResponseDto })
  async me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WalletResponseDto> {
    const wallet = await this.getOrCreateWallet.execute(user.playerId);
    return WalletResponseDto.fromDomain(wallet);
  }
}
