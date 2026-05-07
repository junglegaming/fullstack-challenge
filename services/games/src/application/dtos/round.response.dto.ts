import { RoundStatus } from '@/domain/enums/round-status.enum';

export class RoundResponseDto {
  constructor(
    public readonly roundId: string,
    public readonly status: RoundStatus,
    public readonly crashPoint: number,
    public readonly currentMultiplier: number,
  ) {}
}
