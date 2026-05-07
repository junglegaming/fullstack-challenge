import { BetPlacedEventDto } from '../dtos/bet-placed-event.dto';
import { BetSettledEventDto } from '../dtos/bet-settled-event.dto';
import { ProcessDebitUseCase } from '../commands/process-debit.usecase';
import { ProcessCreditUseCase } from '../commands/process-credit.usecase';

export class WalletEventHandler {
  constructor(
    private readonly processDebitUseCase: ProcessDebitUseCase,
    private readonly processCreditUseCase: ProcessCreditUseCase,
  ) {}

  async handleBetPlaced(payload: Record<string, unknown>): Promise<void> {
    const event = new BetPlacedEventDto(
      payload.playerId as string,
      BigInt(payload.amountCents as string | number),
      payload.betId as string,
    );

    await this.processDebitUseCase.execute(event);
  }

  async handleBetSettled(payload: Record<string, unknown>): Promise<void> {
    const event = new BetSettledEventDto(
      payload.playerId as string,
      BigInt(payload.amountCents as string | number),
      payload.betId as string,
    );

    await this.processCreditUseCase.execute(event);
  }
}
