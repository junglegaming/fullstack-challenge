import { createMessageEnvelope } from "../messaging/message-envelope";
import {
  WALLET_CREDIT_FAILED,
  WALLET_CREDIT_SUCCEEDED,
  type WalletCreditRequestedEnvelope,
} from "../messaging/wallet-events";
import type { WalletEventPublisher } from "../ports/wallet-event.publisher";
import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";
import { Money } from "../../domain/value-objects/money";
import { PlayerId } from "../../domain/value-objects/player-id";
import { InternalCreditWalletUseCase } from "./internal-credit-wallet.use-case";

export class HandleWalletCreditRequestedUseCase {
  constructor(
    private readonly creditWalletUseCase: InternalCreditWalletUseCase,
    private readonly walletEventPublisher: WalletEventPublisher,
  ) {}

  async execute(envelope: WalletCreditRequestedEnvelope): Promise<void> {
    try {
      const result = await this.creditWalletUseCase.execute({
        playerId: PlayerId.create(envelope.payload.playerId),
        amount: parseMoneyFromCentsString(envelope.payload.amountCents),
        idempotencyKey: envelope.idempotencyKey,
        messageType: envelope.type,
      });

      await this.walletEventPublisher.publishCreditSucceeded(
        createMessageEnvelope({
          type: WALLET_CREDIT_SUCCEEDED,
          producer: "wallets-service",
          correlationId: envelope.correlationId,
          causationId: envelope.messageId,
          idempotencyKey: envelope.idempotencyKey,
          payload: {
            playerId: envelope.payload.playerId,
            walletId: result.wallet.id.toString(),
            roundId: envelope.payload.roundId,
            betId: envelope.payload.betId,
            amountCents: envelope.payload.amountCents,
            balanceAfterCents: result.wallet.balance.amountInCents.toString(),
          },
        }),
      );
    } catch (error) {
      await this.walletEventPublisher.publishCreditFailed(
        createMessageEnvelope({
          type: WALLET_CREDIT_FAILED,
          producer: "wallets-service",
          correlationId: envelope.correlationId,
          causationId: envelope.messageId,
          idempotencyKey: envelope.idempotencyKey,
          payload: {
            playerId: envelope.payload.playerId,
            roundId: envelope.payload.roundId,
            betId: envelope.payload.betId,
            amountCents: envelope.payload.amountCents,
            reason: resolveFailureReason(error),
          },
        }),
      );
    }
  }
}

function parseMoneyFromCentsString(value: string): Money {
  if (!/^\d+$/.test(value)) {
    throw new Error("amountCents must be an integer string");
  }

  return Money.fromCents(BigInt(value));
}

function resolveFailureReason(error: unknown): string {
  if (error instanceof WalletNotFoundError) {
    return error.code;
  }

  return "WALLET_CREDIT_FAILED";
}
