export class RoundCrashedDto {
  constructor(
    public readonly roundId: string,
    public readonly crashPoint: number,
    public readonly crashedAt: string,
  ) {}
}
