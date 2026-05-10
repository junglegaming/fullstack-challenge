import { CreateWalletUseCase } from "@/application/use-cases/create-wallet.use-case";
import { GetWalletBalanceUseCase } from "@/application/use-cases/get-wallet-balance.use-case";
import {
  Controller,
  Post,
  Get,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "../guards/auth.guard";
import { WalletAutoCreateGuard } from "../guards/wallet-auto-create.guard";
import { DepositMoneyUseCase } from "@/application/use-cases/deposit-money.use-case";

@Controller("")
export class WalletController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletBalanceUseCase: GetWalletBalanceUseCase,
    private readonly depositMoneyUseCase: DepositMoneyUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req: any) {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        throw new HttpException(
          "Usuário não autenticado",
          HttpStatus.UNAUTHORIZED,
        );
      }

      const wallet = await this.createWalletUseCase.execute({ userId });
      return {
        message: "Carteira criada com sucesso",
        data: wallet.toJSON(),
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get("me")
  @UseGuards(AuthGuard, WalletAutoCreateGuard)
  async getMe(@Request() req: any) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(
        "Usuário não autenticado",
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const balance = await this.getWalletBalanceUseCase.execute(userId);
      return { data: balance };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post("deposit")
  @UseGuards(AuthGuard, WalletAutoCreateGuard)
  async deposit(@Body() dto: { amountInCents: string }, @Request() req: any) {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        throw new HttpException(
          "Usuário não autenticado",
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.depositMoneyUseCase.execute({
        userId,
        amountInCents: BigInt(dto.amountInCents),
      });

      return { message: "Depósito realizado com sucesso" };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
