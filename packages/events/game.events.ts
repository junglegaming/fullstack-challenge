export class BetPlacedEvent {
  constructor(
    public readonly playerId: string,
    public readonly amount: bigint,
  ) {}
}

export class CashoutEvent {
  constructor(
    public readonly playerId: string,
    public readonly amount: bigint,
  ) {}
}