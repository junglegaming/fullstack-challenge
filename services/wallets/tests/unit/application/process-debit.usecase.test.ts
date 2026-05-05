import { describe, it, expect, beforeEach } from 'bun:test';
import { ProcessDebitUseCase } from '@/application/commands/process-debit.usecase';
import { MockWalletRepository } from './mock-wallet-repository';
import { MockInboxRepository } from '../../../src/infrastructure/persistence/repositories/mock-inbox.repository';
import { MockOutboxRepository } from '../../../src/infrastructure/persistence/repositories/mock-outbox.repository';
import { CreateWalletUseCase } from '@/application/commands/create-wallet.usecase';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { BetPlacedEventDto } from '@/application/dtos/bet-placed-event.dto';

describe('ProcessDebitUseCase', () => {
  let repo: MockWalletRepository;
  let inboxRepo: MockInboxRepository;
  let outboxRepo: MockOutboxRepository;
  let createWalletUseCase: CreateWalletUseCase;
  let processDebitUseCase: ProcessDebitUseCase;

  beforeEach(() => {
    repo = new MockWalletRepository();
    inboxRepo = new MockInboxRepository();
    outboxRepo = new MockOutboxRepository();
    createWalletUseCase = new CreateWalletUseCase(repo);
    processDebitUseCase = new ProcessDebitUseCase(repo, inboxRepo, outboxRepo);
  });

  it('processes debit on valid bet placed event', async () => {
    // Create wallet first
    await createWalletUseCase.execute({
      playerId: new PlayerId('player-1'),
      initialBalance: Money.fromReais(100),
    } as any);

    const event = new BetPlacedEventDto('player-1', 3000n, 'bet-123');

    const result = await processDebitUseCase.execute(event);

    expect(result.newBalanceCents).toBe(7000n); // 100 - 30 = 70
    expect(result.transactionId).toBeDefined();
  });

  it('throws on insufficient funds', async () => {
    await createWalletUseCase.execute({
      playerId: new PlayerId('player-1'),
      initialBalance: Money.fromReais(10),
    } as any);

    const event = new BetPlacedEventDto('player-1', 5000n, 'bet-456'); // 50 reais, only 10 balance

    await expect(processDebitUseCase.execute(event)).rejects.toThrow('Insufficient funds');
  });

  it('is idempotent: duplicate event returns same transaction', async () => {
    await createWalletUseCase.execute({
      playerId: new PlayerId('player-1'),
      initialBalance: Money.fromReais(100),
    } as any);

    const event = new BetPlacedEventDto('player-1', 3000n, 'bet-idempotent');

    const result1 = await processDebitUseCase.execute(event);
    const result2 = await processDebitUseCase.execute(event); // Same event again

    expect(result2.transactionId).toBe(result1.transactionId);
    expect(result2.newBalanceCents).toBe(7000n); // Still debited only once
  });

  it('throws if wallet not found', async () => {
    const event = new BetPlacedEventDto('player-unknown', 1000n, 'bet-999');

    await expect(processDebitUseCase.execute(event)).rejects.toThrow('Wallet not found');
  });
});
