import { BetStatus } from '@/domain/enums/bet-status.enum';

export class BetResponseDto {
  constructor(
    public readonly betId: string,
    public readonly playerId: string,
    public readonly amountCents: bigint,
    public readonly status: BetStatus,
    public readonly cashoutMultiplier: number | null,
    public readonly payoutCents: bigint,
  ) {}
}
