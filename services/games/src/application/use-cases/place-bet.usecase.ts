import { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { OutboxEventId } from '@/domain/value-objects/outbox-event-id.vo';
import { PlaceBetCommand } from '../commands/place-bet.command';
import { BetResponseDto } from '../dtos/bet.response.dto';
import { BetId } from '@/domain/value-objects/bet-id.vo';
import { Bet } from '@/domain/entities/bet.entity';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

export class PlaceBetUseCase {
  constructor(
    private readonly roundRepo: RoundRepository,
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
      'bet_placed',
      {
        betId: bet.betId.raw,
        playerId: cmd.playerId.raw,
        roundId: round.roundId.raw,
        amountCents: Number(cmd.amount.amount),
        idempotencyKey: bet.betId.raw,
      },
    );

    await this.roundRepo.save(round, [outboxEvent]);

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
