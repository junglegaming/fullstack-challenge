
import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { CreateWalletUseCase } from "../../application/usecases/create-wallet.usecase";
import { GetWalletUseCase } from "../../application/usecases/get-wallet.usecase";

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
  
  @Post()
  async create(@Req() req: AuthenticatedRequest){
    const playerId = "test-player1"

    const wallet = await this.createWallet.execute(playerId)

    return{
      playerId: wallet.playerId,
      balance: wallet.balance.toString(),
    }
  }

  @Get('me')
  async me(@Req() req: AuthenticatedRequest){
    const playerId = "test-player"//req.user.sub

    const wallet = await this.getWallet.execute(playerId)

    return {
      playerId: wallet.playerId,
      balance: wallet.balance.toString(),
    }
  }
}
