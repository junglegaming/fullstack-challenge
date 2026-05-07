import { describe, it, expect, beforeEach } from 'bun:test';
import { CreateWalletUseCase } from '@/application/commands/create-wallet.usecase';
import { MockWalletRepository } from './mock-wallet-repository';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { CreateWalletDto } from '@/application/dtos/create-wallet.dto';

describe('CreateWalletUseCase', () => {
  let repo: MockWalletRepository;
  let useCase: CreateWalletUseCase;

  beforeEach(() => {
    repo = new MockWalletRepository();
    useCase = new CreateWalletUseCase(repo);
  });

  it('creates a wallet with initial balance', async () => {
    const dto = new CreateWalletDto(
      new PlayerId('player-1'),
      Money.fromReais(100),
    );

    const result = await useCase.execute(dto);

    expect(result.playerId).toBe('player-1');
    expect(result.balanceCents).toBe(10000n);
  });

  it('rejects creating duplicate wallet for same player', async () => {
    const dto = new CreateWalletDto(
      new PlayerId('player-1'),
      Money.fromReais(100),
    );

    await useCase.execute(dto);

    await expect(useCase.execute(dto)).rejects.toThrow('Wallet already exists for player player-1');
  });

  it('creates wallet with zero initial balance', async () => {
    const dto = new CreateWalletDto(
      new PlayerId('player-2'),
      Money.zero(),
    );

    const result = await useCase.execute(dto);

    expect(result.balanceCents).toBe(0n);
  });
});
