export class BetPlacedDto {
  constructor(
    public readonly roundId: string,
    public readonly betId: string,
    public readonly playerId: string,
    public readonly amountCents: bigint,
  ) {}
}
