import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Money } from '../../domain/value-objects/money.vo';

export class CreateWalletDto {
  constructor(
    public readonly playerId: PlayerId,
    public readonly initialBalance: Money,
  ) {}
}
