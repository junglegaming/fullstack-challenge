import type { Bet as PrismaBet } from "@prisma/client";
import { Bet } from "../../../../domain/entities/bet";
import { BetId } from "../../../../domain/value-objects/bet-id";
import { PayoutSettlementStatus } from "../../../../domain/value-objects/payout-settlement-status";
import { BetStatus } from "../../../../domain/value-objects/round-status";
import { Money } from "../../../../domain/value-objects/money";
import { Multiplier } from "../../../../domain/value-objects/multiplier";
import { PlayerId } from "../../../../domain/value-objects/player-id";
import { RoundId } from "../../../../domain/value-objects/round-id";

export class BetMapper {
  static toDomain(record: PrismaBet): Bet {
    return Bet.reconstitute({
      id: BetId.create(record.id),
      roundId: RoundId.create(record.roundId),
      playerId: PlayerId.create(record.playerId),
      amount: Money.fromCents(record.amountCents),
      status: record.status as BetStatus,
      idempotencyKey: record.idempotencyKey,
      cashOutMultiplier:
        record.cashOutMultiplierBps === null
          ? null
          : Multiplier.fromBasisPoints(record.cashOutMultiplierBps),
      payout:
        record.payoutCents === null ? null : Money.fromCents(record.payoutCents),
      payoutSettlementStatus: record.payoutSettlementStatus as PayoutSettlementStatus | null,
      payoutCreditIdempotencyKey: record.payoutCreditIdempotencyKey,
      payoutSettlementFailureReason: record.payoutSettlementFailureReason,
    });
  }

  static toPersistence(bet: Bet): PrismaBet {
    return {
      id: bet.id.toString(),
      roundId: bet.roundId.toString(),
      playerId: bet.playerId.toString(),
      amountCents: bet.amount.amountInCents,
      status: bet.status as PrismaBet["status"],
      cashOutMultiplierBps: bet.cashOutMultiplier?.valueInBasisPoints ?? null,
      payoutCents: bet.payout?.amountInCents ?? null,
      idempotencyKey: bet.idempotencyKey,
      payoutSettlementStatus: bet.payoutSettlementStatus,
      payoutCreditIdempotencyKey: bet.payoutCreditIdempotencyKey,
      payoutSettlementFailureReason: bet.payoutSettlementFailureReason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static toPersistenceUpdate(bet: Bet): Omit<PrismaBet, "id" | "roundId" | "createdAt"> {
    return {
      playerId: bet.playerId.toString(),
      amountCents: bet.amount.amountInCents,
      status: bet.status as PrismaBet["status"],
      cashOutMultiplierBps: bet.cashOutMultiplier?.valueInBasisPoints ?? null,
      payoutCents: bet.payout?.amountInCents ?? null,
      idempotencyKey: bet.idempotencyKey,
      payoutSettlementStatus: bet.payoutSettlementStatus,
      payoutCreditIdempotencyKey: bet.payoutCreditIdempotencyKey,
      payoutSettlementFailureReason: bet.payoutSettlementFailureReason,
      updatedAt: new Date(),
    };
  }
}
