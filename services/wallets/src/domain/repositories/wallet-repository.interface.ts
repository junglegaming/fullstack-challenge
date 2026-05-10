import { Wallet } from "@/domain/entities/wallet";
import { Money } from "@/domain/value-objects/Money";

export interface IWalletRepository {
  findByUserId(userId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
  create(wallet: Wallet): Promise<void>;
}

export interface WalletProps {
  userId: string;
  balance: Money;
  updatedAt: Date;
}
