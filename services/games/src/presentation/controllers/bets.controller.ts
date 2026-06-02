import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Post,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { GameLoop } from "../../application/game-loop";
import { TypeOrmGameRepository } from "../../infrastructure/persistence/typeorm-game.repository";
import { GameEventsPublisher } from "../../infrastructure/messaging/game-events.publisher";
import { GameGateway } from "../gateways/game.gateway";
import { PlayerId } from "../decorators/player-id.decorator";
import { PlaceBetRequestDto } from "../dtos/place-bet-request.dto";
import { Money } from "../../domain/money";
import {
  AlreadyCashedOutError,
  BetAlreadyPlacedError,
  BetNotFoundError,
  BettingClosedError,
  CashoutNotAllowedError,
} from "../../domain/errors";

@Controller()
export class BetsController {
  constructor(
    private readonly gameLoop: GameLoop,
    private readonly repository: TypeOrmGameRepository,
    private readonly publisher: GameEventsPublisher,
    private readonly gateway: GameGateway,
  ) {}

  @Post("bet")
  async placeBet(
    @PlayerId() playerId: string,
    @Body() dto: PlaceBetRequestDto,
  ) {
    const betId = randomUUID();
    const amount = Money.fromCents(dto.amountCents);

    try {
      this.gameLoop.placeBet(betId, playerId, amount);
    } catch (err) {
      if (err instanceof BettingClosedError) throw new BadRequestException(err.message);
      if (err instanceof BetAlreadyPlacedError) throw new ConflictException(err.message);
      throw err;
    }

    await this.publisher.publishReserve(betId, playerId, dto.amountCents);
    return { betId };
  }

  @Post("bet/cashout")
  async cashOut(@PlayerId() playerId: string) {
    const round = this.gameLoop.getCurrentRound();

    let multiplier: number;
    let payout: Money;
    try {
      ({ multiplier, payout } = this.gameLoop.cashOut(playerId));
    } catch (err) {
      if (err instanceof CashoutNotAllowedError) throw new BadRequestException(err.message);
      if (err instanceof BetNotFoundError) throw new NotFoundException(err.message);
      if (err instanceof AlreadyCashedOutError) throw new ConflictException(err.message);
      throw err;
    }

    const bet = round!.bets.get(playerId)!;
    await this.repository.saveBet(bet, round!.id);
    await this.publisher.publishSettle(bet.id, playerId, "win", payout.cents);
    this.gateway.emitBetCashedOut(round!.id, playerId, multiplier, payout.cents);

    return { multiplier, payoutCents: payout.cents };
  }

  @Get("bets/me")
  async getMyBets(@PlayerId() playerId: string) {
    const bets = await this.repository.findBetsByPlayerId(playerId);
    return bets.map((b) => ({
      betId: b.id,
      roundId: b.roundId,
      amountCents: b.amount.cents,
      status: b.status,
      payoutCents: b.payout?.cents ?? null,
    }));
  }
}
