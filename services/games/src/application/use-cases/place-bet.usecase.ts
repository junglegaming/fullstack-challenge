import type { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { OutboxEventId } from '@/domain/value-objects/outbox-event-id.vo';
import { PlaceBetCommand } from '../commands/place-bet.command';
import { BetResponseDto } from '../dtos/bet.response.dto';
import { BetId } from '@/domain/value-objects/bet-id.vo';
import { Bet } from '@/domain/entities/bet.entity';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';
import { Injectable, Inject } from '@nestjs/common';
import type { IWebSocketEmitter } from '../ports/websocket-emitter.port';
import { BetPlacedDto } from '../../presentation/dtos/bet-placed.dto';

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject('RoundRepository') private readonly roundRepo: RoundRepository,
    @Inject('IWebSocketEmitter') private readonly webSocketEmitter: IWebSocketEmitter,
  ) {}

  async execute(cmd: PlaceBetCommand): Promise<BetResponseDto> {
    const round = await this.roundRepo.getCurrent();

    if (round.roundStatus !== 'BETTING') {
      throw new InvalidStateTransitionError(round.roundStatus, 'BETTING');
    }

    const bet = round.placeBet(
      new BetId(crypto.randomUUID()),
      cmd.playerId,
      cmd.amount,
    );

    const outboxEvent = new OutboxEvent(
      new OutboxEventId(bet.betId.raw),
      'Bet',
      bet.betId.raw,
      'bet-placed',
      {
        betId: bet.betId.raw,
        playerId: cmd.playerId.raw,
        roundId: round.roundId.raw,
        amountCents: cmd.amount.amount.toString(),
        idempotencyKey: bet.betId.raw,
      },
    );

    await this.roundRepo.save(round, [outboxEvent]);

    this.webSocketEmitter.broadcastBetPlaced(
      new BetPlacedDto(
        round.roundId.raw,
        bet.betId.raw,
        bet.player.raw,
        bet.betAmount.amount,
      ),
    );

    return new BetResponseDto(
      bet.betId.raw,
      bet.player.raw,
      bet.betAmount.amount,
      bet.betStatus,
      bet.cashoutMultiplierValue?.raw ?? null,
      bet.payout.amount,
    );
  }
}
