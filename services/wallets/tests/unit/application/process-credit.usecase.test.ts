import { describe, it, expect, beforeEach } from 'bun:test';
import { ProcessCreditUseCase } from '@/application/commands/process-credit.usecase';
import { MockWalletRepository } from './mock-wallet-repository';
import { CreateWalletUseCase } from '@/application/commands/create-wallet.usecase';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { BetSettledEventDto } from '@/application/dtos/bet-settled-event.dto';

describe('ProcessCreditUseCase', () => {
  let repo: MockWalletRepository;
  let createWalletUseCase: CreateWalletUseCase;
  let processCreditUseCase: ProcessCreditUseCase;

  beforeEach(() => {
    repo = new MockWalletRepository();
    createWalletUseCase = new CreateWalletUseCase(repo);
    processCreditUseCase = new ProcessCreditUseCase(repo);
  });

  it('processes credit on bet settled event', async () => {
    await createWalletUseCase.execute({
      playerId: new PlayerId('player-1'),
      initialBalance: Money.fromReais(50),
    } as any);

    const event = new BetSettledEventDto('player-1', 8000n, 'bet-123'); // 80 reais won

    const result = await processCreditUseCase.execute(event);

    expect(result.newBalanceCents).toBe(13000n); // 50 + 80 = 130
    expect(result.transactionId).toBeDefined();
  });

  it('is idempotent: duplicate event returns same transaction', async () => {
    await createWalletUseCase.execute({
      playerId: new PlayerId('player-1'),
      initialBalance: Money.zero(),
    } as any);

    const event = new BetSettledEventDto('player-1', 5000n, 'bet-idempotent');

    const result1 = await processCreditUseCase.execute(event);
    const result2 = await processCreditUseCase.execute(event);

    expect(result2.transactionId).toBe(result1.transactionId);
    expect(result2.newBalanceCents).toBe(5000n); // Credited only once
  });

  it('throws if wallet not found', async () => {
    const event = new BetSettledEventDto('player-unknown', 1000n, 'bet-999');

    await expect(processCreditUseCase.execute(event)).rejects.toThrow('Wallet not found');
  });
});
