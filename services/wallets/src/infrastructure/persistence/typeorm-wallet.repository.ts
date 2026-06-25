import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Wallet } from "../../domain/entities/wallet.aggregate";
import { WalletTransaction } from "../../domain/entities/wallet-transaction.entity";
import type { WalletRepository } from "../../application/ports/wallet.repository";
import { WalletMapper } from "./wallet.mapper";
import { WalletOrmEntity } from "./wallet.orm-entity";
import { WalletTransactionOrmEntity } from "./wallet-transaction.orm-entity";

@Injectable()
export class TypeOrmWalletRepository implements WalletRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<Wallet | null> {
    const row = await this.dataSource
      .getRepository(WalletOrmEntity)
      .findOne({ where: { id } });
    return row ? WalletMapper.toDomain(row) : null;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const row = await this.dataSource
      .getRepository(WalletOrmEntity)
      .findOne({ where: { playerId } });
    return row ? WalletMapper.toDomain(row) : null;
  }

  async create(wallet: Wallet): Promise<Wallet> {
    const repo = this.dataSource.getRepository(WalletOrmEntity);
    await repo.insert(WalletMapper.toOrm(wallet));
    const row = await repo.findOneByOrFail({ id: wallet.id });
    return WalletMapper.toDomain(row);
  }

  async applyTransaction(
    wallet: Wallet,
    transaction: WalletTransaction,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {

      await manager.getRepository(WalletTransactionOrmEntity).insert(
        WalletMapper.transactionToOrm(transaction),
      );
      await manager.getRepository(WalletOrmEntity).update(
        { id: wallet.id },
        {
          balanceCents: wallet.getBalance().toCents().toString(),
          updatedAt: wallet.getUpdatedAt(),
        },
      );
    });
  }

  async findTransactionByReference(
    reference: string,
  ): Promise<WalletTransaction | null> {
    const row = await this.dataSource
      .getRepository(WalletTransactionOrmEntity)
      .findOne({ where: { reference } });
    return row ? WalletMapper.transactionToDomain(row) : null;
  }
}
