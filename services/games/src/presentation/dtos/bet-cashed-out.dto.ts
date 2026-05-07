export class BetCashedOutDto {
  constructor(
    public readonly roundId: string,
    public readonly betId: string,
    public readonly playerId: string,
    public readonly multiplier: number,
    public readonly payoutCents: bigint,
  ) {}
}
