import { Injectable, Inject } from '@nestjs/common';
import { Wallet } from '../../domain/entities/wallet.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { IWalletRepository } from '../ports/wallet-repository.port';
import { IInboxRepository } from '../ports/inbox-repository.port';
import { IOutboxRepository } from '../ports/outbox-repository.port';
import { BetSettledEventDto } from '../dtos/bet-settled-event.dto';
import { WalletUpdatedEventDto } from '../dtos/wallet-updated-event.dto';
import { InboxEvent } from '../../infrastructure/persistence/entities/inbox-event.entity';
import { OutboxEvent } from '../../infrastructure/persistence/entities/outbox-event.entity';
import { InboxEventResult } from '../../infrastructure/persistence/entities/inbox-event.entity';

@Injectable()
export class ProcessCreditUseCase {
  private readonly MAX_RETRIES = 3;

  constructor(
    @Inject('IWalletRepository') private readonly walletRepository: IWalletRepository,
    @Inject('IInboxRepository') private readonly inboxRepository: IInboxRepository,
    @Inject('IOutboxRepository') private readonly outboxRepository: IOutboxRepository,
  ) {}

  async execute(
    event: BetSettledEventDto,
    messageId?: string,
  ): Promise<{ transactionId: string; newBalanceCents: bigint }> {
    const playerId = new PlayerId(event.playerId);
    const amount = new Money(event.amountCents);
    const referenceId = event.betId;

    // Use messageId as inbox key, fallback to referenceId
    const inboxKey = messageId || `bet-settled-${referenceId}`;

    // Inbox: check if already processed
    const inboxEvent = await this.inboxRepository.findById(inboxKey);
    if (inboxEvent && inboxEvent.status === 'PROCESSED') {
      // Already processed, return stored result (idempotency)
      if (inboxEvent.result) {
        return inboxEvent.result;
      }
      throw new Error(`Event ${inboxKey} processed but no result stored`);
    }

    // Create inbox entry if not exists
    const inbox = inboxEvent || new InboxEvent(
      inboxKey,
      'BetSettled',
      { playerId: event.playerId, amountCents: event.amountCents, betId: event.betId },
      'PENDING',
    );

    if (!inboxEvent) {
      await this.inboxRepository.save(inbox);
    }

    try {
      const wallet = await this.walletRepository.findByPlayerId(playerId);
      if (!wallet) {
        throw new Error(`Wallet not found for player ${event.playerId}`);
      }

      // Idempotency in domain (referenceId check)
      const transaction = wallet.credit(amount, referenceId);

      // Save wallet
      await this.walletRepository.save(wallet);

      // Prepare result
      const result: InboxEventResult = {
        transactionId: transaction.id.raw,
        newBalanceCents: wallet.walletBalance.amount,
      };

      // Outbox: create WalletUpdated event
      const outboxEvent = new OutboxEvent(
        crypto.randomUUID(),
        'WalletUpdated',
        new WalletUpdatedEventDto(
          wallet.walletId.raw,
          wallet.walletPlayerId.raw,
          wallet.walletBalance.amount,
          transaction.id.raw,
          'CREDIT',
          referenceId,
          new Date().toISOString(),
        ),
      );
      await this.outboxRepository.save(outboxEvent);

      // Mark inbox as processed with result
      inbox.markAsProcessed(result);
      await this.inboxRepository.update(inbox);

      return result;
    } catch (error) {
      // Mark inbox as failed
      inbox.markAsFailed(error as Error, this.MAX_RETRIES);
      await this.inboxRepository.update(inbox);
      throw error;
    }
  }
}
