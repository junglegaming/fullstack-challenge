import { createMessageEnvelope } from "../messaging/message-envelope";
import {
  WALLET_DEBIT_FAILED,
  WALLET_DEBIT_SUCCEEDED,
  type WalletDebitRequestedEnvelope,
} from "../messaging/wallet-events";
import type { WalletEventPublisher } from "../ports/wallet-event.publisher";
import { InsufficientBalanceError } from "../../domain/errors/insufficient-balance.error";
import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";
import { Money } from "../../domain/value-objects/money";
import { PlayerId } from "../../domain/value-objects/player-id";
import { InternalDebitWalletUseCase } from "./internal-debit-wallet.use-case";

export class HandleWalletDebitRequestedUseCase {
  constructor(
    private readonly debitWalletUseCase: InternalDebitWalletUseCase,
    private readonly walletEventPublisher: WalletEventPublisher,
  ) {}

  async execute(envelope: WalletDebitRequestedEnvelope): Promise<void> {
    try {
      const result = await this.debitWalletUseCase.execute({
        playerId: PlayerId.create(envelope.payload.playerId),
        amount: parseMoneyFromCentsString(envelope.payload.amountCents),
        idempotencyKey: envelope.idempotencyKey,
        messageType: envelope.type,
      });

      await this.walletEventPublisher.publishDebitSucceeded(
        createMessageEnvelope({
          type: WALLET_DEBIT_SUCCEEDED,
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
      await this.walletEventPublisher.publishDebitFailed(
        createMessageEnvelope({
          type: WALLET_DEBIT_FAILED,
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
  if (error instanceof InsufficientBalanceError) {
    return error.code;
  }

  if (error instanceof WalletNotFoundError) {
    return error.code;
  }

  return "WALLET_DEBIT_FAILED";
}
