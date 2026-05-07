import { PlayerId } from '@/domain/value-objects/player-id.vo';

export class CashoutCommand {
  constructor(
    public readonly playerId: PlayerId,
  ) {}
}
