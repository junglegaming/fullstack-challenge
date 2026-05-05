import { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { OutboxEventId } from '@/domain/value-objects/outbox-event-id.vo';
import { CashoutCommand } from '../commands/cashout.command';
import { BetResponseDto } from '../dtos/bet.response.dto';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

export class CashoutUseCase {
  constructor(
    private readonly roundRepo: RoundRepository,
  ) {}

  async execute(cmd: CashoutCommand): Promise<BetResponseDto> {
    const round = await this.roundRepo.getCurrent();

    if (round.roundStatus !== 'RUNNING') {
      throw new InvalidStateTransitionError(round.roundStatus, 'RUNNING');
    }

    const bet = round.cashOut(cmd.playerId);

    const outboxEvent = new OutboxEvent(
      new OutboxEventId(`cashout-${bet.betId.raw}`),
      'Bet',
      bet.betId.raw,
      'cashout_requested',
      {
        betId: bet.betId.raw,
        playerId: cmd.playerId.raw,
        roundId: round.roundId.raw,
        amountCents: Number(bet.payout.amount),
        multiplier: bet.cashoutMultiplierValue?.raw ?? 0,
        idempotencyKey: `cashout-${bet.betId.raw}`,
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
