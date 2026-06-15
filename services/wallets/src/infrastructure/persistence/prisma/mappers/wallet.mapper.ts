import { Wallet as PrismaWallet } from "@prisma/client";
import { Wallet } from "../../../../domain/entities/wallet";
import { Money } from "../../../../domain/value-objects/money";
import { PlayerId } from "../../../../domain/value-objects/player-id";
import { WalletId } from "../../../../domain/value-objects/wallet-id";

export class WalletMapper {
  static toDomain(record: PrismaWallet): Wallet {
    return Wallet.reconstitute({
      id: WalletId.create(record.id),
      playerId: PlayerId.create(record.playerId),
      balance: Money.fromCents(record.balanceCents),
    });
  }

  static toPersistence(wallet: Wallet): {
    id: string;
    playerId: string;
    balanceCents: bigint;
  } {
    return {
      id: wallet.id.toString(),
      playerId: wallet.playerId.toString(),
      balanceCents: wallet.balance.amountInCents,
    };
  }
}
