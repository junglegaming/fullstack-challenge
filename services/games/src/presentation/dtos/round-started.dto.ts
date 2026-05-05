export class RoundStartedDto {
  constructor(
    public readonly roundId: string,
    public readonly status: string,
    public readonly crashPoint: number,
    public readonly startedAt: string,
  ) {}
}
