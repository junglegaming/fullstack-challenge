/**
 * Event received from Games service when a bet is settled (cashed out or won).
 * This triggers a credit operation on the wallet.
 */
export class BetSettledEventDto {
  constructor(
    public readonly playerId: string,
    public readonly amountCents: bigint,
    public readonly betId: string,
  ) {}
}
