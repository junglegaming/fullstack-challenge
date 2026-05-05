import { Wallet } from '../../domain/entities/wallet.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { IWalletRepository } from '../ports/wallet-repository.port';
import { BetPlacedEventDto } from '../dtos/bet-placed-event.dto';

export class ProcessDebitUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(event: BetPlacedEventDto): Promise<{ transactionId: string; newBalanceCents: bigint }> {
    const playerId = new PlayerId(event.playerId);
    const amount = new Money(event.amountCents);
    const referenceId = event.betId; // Use betId as idempotency key

    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      throw new Error(`Wallet not found for player ${event.playerId}`);
    }

    // Validate balance before debiting (the wallet entity also validates, but we do an early check)
    if (wallet.walletBalance.isLessThan(amount)) {
      throw new Error('Insufficient funds');
    }

    // Idempotency: if same referenceId was already processed, returns existing transaction
    const transaction = wallet.debit(amount, referenceId);

    await this.walletRepository.save(wallet);

    return {
      transactionId: transaction.id.raw,
      newBalanceCents: wallet.walletBalance.amount,
    };
  }
}
