import type {
  BetCashoutUseCaseDTO,
  CreateBetUseCaseDTO,
} from "@/application/dtos/bet.dto";
import { CashoutBetUseCase } from "@/application/use-cases/cashout-bet.use-case";
import { CreateBetUseCase } from "@/application/use-cases/create-bet.use-case";
import { IRoundRepository } from "@/domain/repositories/IRoundRepository";
import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../guards/auth.guard";

@Controller("")
export class GameController {
  constructor(
    private readonly createBetUseCase: CreateBetUseCase,
    private readonly cashoutBetUseCase: CashoutBetUseCase,
    private readonly roundRepository: IRoundRepository,
  ) {}

  @Post("bet")
  @UseGuards(AuthGuard)
  async createBet(@Body() dto: CreateBetUseCaseDTO, @Request() req: any) {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        throw new HttpException(
          "Usuário não autenticado",
          HttpStatus.UNAUTHORIZED,
        );
      }

      const finalDto = {
        ...dto,
        userId,
      };

      const bet = await this.createBetUseCase.execute(finalDto);

      return {
        message: "Aposta realizada com sucesso",
        data: bet.toJSON(),
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("bet/cashout")
  @UseGuards(AuthGuard)
  async cashout(@Body() dto: BetCashoutUseCaseDTO, @Request() req: any) {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        throw new HttpException(
          "Usuário não autenticado",
          HttpStatus.UNAUTHORIZED,
        );
      }

      const finalDto = { ...dto, userId };
      const result = await this.cashoutBetUseCase.execute(finalDto);

      return {
        message: "Cashout realizado com sucesso!",
        result
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get("leaderboard")
  @UseGuards(AuthGuard)
  async getLeaderboard() {
    try {
      const topPlayers = await this.roundRepository.findTopPlayers(10);
      return {
        data: topPlayers,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get("rounds/history")
  async getHistory() {
    const history = await this.roundRepository.findHistory();
    return {
      data: history.map((r) => r.toPublicJSON()),
    };
  }

  @Get("rounds/:roundId/verify")
  async verifyRound(@Request() req: any) {
    const { roundId } = req.params;
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new HttpException("Rodada não encontrada", HttpStatus.NOT_FOUND);
    }
    return {
      data: round.toPublicJSON(),
    };
  }
}
