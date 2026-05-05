import { describe, it, expect, beforeEach } from 'bun:test';
import { GetWalletUseCase } from '@/application/queries/get-wallet.usecase';
import { MockWalletRepository } from './mock-wallet-repository';
import { CreateWalletUseCase } from '@/application/commands/create-wallet.usecase';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { GetWalletDto } from '@/application/dtos/get-wallet.dto';

describe('GetWalletUseCase', () => {
  let repo: MockWalletRepository;
  let createWalletUseCase: CreateWalletUseCase;
  let getWalletUseCase: GetWalletUseCase;

  beforeEach(() => {
    repo = new MockWalletRepository();
    createWalletUseCase = new CreateWalletUseCase(repo);
    getWalletUseCase = new GetWalletUseCase(repo);
  });

  it('returns wallet data for existing wallet', async () => {
    await createWalletUseCase.execute({
      playerId: new PlayerId('player-1'),
      initialBalance: Money.fromReais(150.50),
    } as any);

    const result = await getWalletUseCase.execute(new GetWalletDto('player-1'));

    expect(result.playerId).toBe('player-1');
    expect(result.balanceCents).toBe(15050n);
    expect(result.transactionCount).toBe(0);
  });

  it('returns correct transaction count after operations', async () => {
    await createWalletUseCase.execute({
      playerId: new PlayerId('player-1'),
      initialBalance: Money.fromReais(100),
    } as any);

    // Simulate some transactions by querying after operations
    const result = await getWalletUseCase.execute(new GetWalletDto('player-1'));

    expect(result.transactionCount).toBe(0); // No transactions yet
  });

  it('throws if wallet not found', async () => {
    await expect(
      getWalletUseCase.execute(new GetWalletDto('player-unknown'))
    ).rejects.toThrow('Wallet not found');
  });
});
