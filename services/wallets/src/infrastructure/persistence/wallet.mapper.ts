import { Wallet } from "../../domain/entities/wallet.aggregate";
import { WalletTransaction } from "../../domain/entities/wallet-transaction.entity";
import { Money } from "../../domain/value-objects/money.vo";
import { WalletOrmEntity } from "./wallet.orm-entity";
import { WalletTransactionOrmEntity } from "./wallet-transaction.orm-entity";

export const WalletMapper = {

  toDomain(row: WalletOrmEntity): Wallet {
    return Wallet.rehydrate({
      id: row.id,
      playerId: row.playerId,
      balance: Money.fromCents(row.balanceCents),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toOrm(wallet: Wallet): WalletOrmEntity {
    const row = new WalletOrmEntity();
    row.id = wallet.id;
    row.playerId = wallet.playerId;
    row.balanceCents = wallet.getBalance().toCents().toString();
    return row;
  },

  transactionToDomain(row: WalletTransactionOrmEntity): WalletTransaction {
    return new WalletTransaction(
      row.id,
      row.walletId,
      row.type,
      Money.fromCents(row.amountCents),
      row.reference,
      Money.fromCents(row.balanceAfterCents),
      row.createdAt,
    );
  },

  transactionToOrm(tx: WalletTransaction): WalletTransactionOrmEntity {
    const row = new WalletTransactionOrmEntity();
    row.id = tx.id;
    row.walletId = tx.walletId;
    row.type = tx.type;
    row.amountCents = tx.amount.toCents().toString();
    row.reference = tx.reference;
    row.balanceAfterCents = tx.balanceAfter.toCents().toString();
    return row;
  },
};
