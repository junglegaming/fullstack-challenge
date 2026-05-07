export class MultiplierUpdateDto {
  constructor(
    public readonly roundId: string,
    public readonly multiplier: number,
    public readonly elapsedMs: number,
  ) {}
}
