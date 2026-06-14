import { Wallet } from "../../domain/entities/wallet";
import { WalletTransaction } from "../../domain/entities/wallet-transaction";

export type WalletMutationResult = {
  wallet: Wallet;
  transaction: WalletTransaction;
  isReplay: boolean;
};
