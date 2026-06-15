import {
  LedgerTransaction as PrismaLedgerTransaction,
  LedgerTransactionType as PrismaLedgerTransactionType,
} from "@prisma/client";
import { WalletTransaction } from "../../../../domain/entities/wallet-transaction";
import { Money } from "../../../../domain/value-objects/money";
import { WalletId } from "../../../../domain/value-objects/wallet-id";
import { WalletTransactionType } from "../../../../domain/value-objects/wallet-transaction-type";

export class WalletTransactionMapper {
  static toDomain(record: PrismaLedgerTransaction): WalletTransaction {
    return WalletTransaction.reconstitute({
      id: record.id,
      walletId: WalletId.create(record.walletId),
      type: WalletTransactionMapper.toDomainType(record.type),
      amount: Money.fromCents(record.amountCents),
      balanceAfter: Money.fromCents(record.balanceAfterCents),
      idempotencyKey: record.idempotencyKey,
    });
  }

  static toPersistence(transaction: WalletTransaction): {
    id: string;
    walletId: string;
    idempotencyKey: string;
    type: PrismaLedgerTransactionType;
    amountCents: bigint;
    balanceAfterCents: bigint;
  } {
    return {
      id: transaction.id,
      walletId: transaction.walletId.toString(),
      idempotencyKey: transaction.idempotencyKey,
      type: WalletTransactionMapper.toPersistenceType(transaction.type),
      amountCents: transaction.amount.amountInCents,
      balanceAfterCents: transaction.balanceAfter.amountInCents,
    };
  }

  private static toDomainType(type: PrismaLedgerTransactionType): WalletTransactionType {
    return type === PrismaLedgerTransactionType.CREDIT
      ? WalletTransactionType.CREDIT
      : WalletTransactionType.DEBIT;
  }

  private static toPersistenceType(
    type: WalletTransactionType,
  ): PrismaLedgerTransactionType {
    return type === WalletTransactionType.CREDIT
      ? PrismaLedgerTransactionType.CREDIT
      : PrismaLedgerTransactionType.DEBIT;
  }
}
