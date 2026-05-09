
import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { CreateWalletUseCase } from "../../application/usecases/create-wallet.usecase";
import { GetWalletUseCase } from "../../application/usecases/get-wallet.usecase";
import { JwtAuthGuard } from "../../../../../packages/auth/src/jwt-auth.guard";

@Controller("wallets")
export class WalletsController {
  constructor(
    private createWallet: CreateWalletUseCase,
    private getWallet: GetWalletUseCase,
  ){}

   @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };  
  }
  
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: AuthenticatedRequest){
    const playerId = req.user.sub

    const wallet = await this.createWallet.execute(playerId)

    return{
      playerId: wallet.playerId,
      balance: wallet.balance.toString(),
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthenticatedRequest){
    const playerId = req.user.sub

    const wallet = await this.getWallet.execute(playerId)


    return {
      sub: playerId,
      balance: wallet.balance.toString(),
    }
  }
}
