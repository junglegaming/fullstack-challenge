/**
 * Event received from Games service when a bet is placed.
 * This triggers a debit operation on the wallet.
 */
export class BetPlacedEventDto {
  constructor(
    public readonly playerId: string,
    public readonly amountCents: bigint,
    public readonly betId: string,
  ) {}
}
