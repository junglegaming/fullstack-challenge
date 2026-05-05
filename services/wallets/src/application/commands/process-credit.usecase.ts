import { Wallet } from '../../domain/entities/wallet.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { IWalletRepository } from '../ports/wallet-repository.port';
import { BetSettledEventDto } from '../dtos/bet-settled-event.dto';

export class ProcessCreditUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(event: BetSettledEventDto): Promise<{ transactionId: string; newBalanceCents: bigint }> {
    const playerId = new PlayerId(event.playerId);
    const amount = new Money(event.amountCents);
    const referenceId = event.betId; // Use betId as idempotency key

    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      throw new Error(`Wallet not found for player ${event.playerId}`);
    }

    // Idempotency: if same referenceId was already processed, returns existing transaction
    const transaction = wallet.credit(amount, referenceId);

    await this.walletRepository.save(wallet);

    return {
      transactionId: transaction.id.raw,
      newBalanceCents: wallet.walletBalance.amount,
    };
  }
}
