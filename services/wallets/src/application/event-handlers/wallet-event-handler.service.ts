import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { ProcessDebitUseCase } from '../commands/process-debit.usecase';
import { ProcessCreditUseCase } from '../commands/process-credit.usecase';
import { StructuredLogger } from '../../infrastructure/logger/structured-logger';

@Injectable()
export class WalletEventHandlerService implements OnApplicationBootstrap {
  private logger: StructuredLogger;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly processDebitUseCase: ProcessDebitUseCase,
    private readonly processCreditUseCase: ProcessCreditUseCase,
  ) {
    this.logger = new StructuredLogger('wallet-event-handler-service');
  }

  async onApplicationBootstrap(): Promise<void> {
    const consumer = this.rabbitMQService.getConsumer();

    // Subscribe to bet-placed event → debit
    consumer.subscribe('bet-placed', async (payload, messageId) => {
      this.logger.info('Processing BetPlaced event', { payload, messageId });
      try {
        const { playerId, amountCents, betId } = payload as Record<string, unknown>;
        if (!playerId || !amountCents || !betId) {
          throw new Error('Invalid BetPlaced payload: missing required fields');
        }
        await this.processDebitUseCase.execute(
          {
            playerId: playerId as string,
            amountCents: BigInt(amountCents as string | number),
            betId: betId as string,
          } as any,
          messageId,
        );
        this.logger.info('BetPlaced processed successfully', { betId });
      } catch (error) {
        this.logger.error('Error processing BetPlaced', { payload, messageId }, error as Error);
        throw error;
      }
    });

    // Subscribe to cashout-requested event → credit
    consumer.subscribe('cashout-requested', async (payload, messageId) => {
      this.logger.info('Processing CashoutRequested event', { payload, messageId });
      try {
        const { playerId, amountCents, betId } = payload as Record<string, unknown>;
        if (!playerId || !amountCents || !betId) {
          throw new Error('Invalid CashoutRequested payload: missing required fields');
        }
        await this.processCreditUseCase.execute(
          {
            playerId: playerId as string,
            amountCents: BigInt(amountCents as string | number),
            betId: betId as string,
          } as any,
          messageId,
        );
        this.logger.info('CashoutRequested processed successfully', { betId });
      } catch (error) {
        this.logger.error('Error processing CashoutRequested', { payload, messageId }, error as Error);
        throw error;
      }
    });

    this.logger.info('Event handlers subscribed');

    // Start consumer after all subscriptions
    await this.rabbitMQService.startConsumer();
  }
}
