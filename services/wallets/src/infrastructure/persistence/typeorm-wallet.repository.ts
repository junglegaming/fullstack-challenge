import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Wallet } from "@/domain/wallet";
import { Money } from "@/domain/money";
import { WalletRepository } from "@/application/wallet.repository";
import { WalletOrmEntity } from "./wallet.orm-entity";
import { WalletReservationOrmEntity } from "./wallet-reservation.orm-entity";

@Injectable()
export class TypeOrmWalletRepository implements WalletRepository {
  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly wallets: Repository<WalletOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const orm = await this.wallets.findOne({
      where: { playerId },
      relations: { reservations: true },
    });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async save(wallet: Wallet): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.upsert(
        WalletOrmEntity,
        {
          id: wallet.id,
          playerId: wallet.playerId,
          availableBalance: wallet.availableBalance.cents.toString(),
        },
        ["id"],
      );

      await manager.delete(WalletReservationOrmEntity, {
        wallet: { id: wallet.id },
      });

      const entries = [...wallet.reservations.entries()];
      if (entries.length > 0) {
        const walletRef = manager.create(WalletOrmEntity, { id: wallet.id });
        const reservations = entries.map(([reservationId, amount]) =>
          manager.create(WalletReservationOrmEntity, {
            reservationId,
            amount: amount.cents.toString(),
            wallet: walletRef,
          }),
        );
        await manager.insert(WalletReservationOrmEntity, reservations);
      }
    });
  }

  private toDomain(orm: WalletOrmEntity): Wallet {
    const reservations = new Map<string, Money>();
    for (const r of orm.reservations) {
      reservations.set(r.reservationId, Money.fromCents(Number(r.amount)));
    }
    return Wallet.reconstitute(
      orm.id,
      orm.playerId,
      Money.fromCents(Number(orm.availableBalance)),
      reservations,
    );
  }
}
