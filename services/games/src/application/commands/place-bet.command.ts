import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';

export class PlaceBetCommand {
  constructor(
    public readonly playerId: PlayerId,
    public readonly amount: Money,
  ) {}
}
