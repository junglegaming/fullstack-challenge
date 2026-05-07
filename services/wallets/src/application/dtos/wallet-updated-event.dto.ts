/**
 * Event published to the outbox after a wallet is updated (debit/credit).
 * This will be published to the message broker for other services.
 */
export class WalletUpdatedEventDto {
  constructor(
    public readonly walletId: string,
    public readonly playerId: string,
    public readonly newBalanceCents: bigint,
    public readonly transactionId: string,
    public readonly transactionType: 'DEBIT' | 'CREDIT',
    public readonly referenceId: string,
    public readonly timestamp: string,
  ) {}
}
