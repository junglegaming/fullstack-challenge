import { Wallet } from "../../domain/entities/wallet";

export type CreateWalletResult = {
  wallet: Wallet;
};

export type GetWalletResult = {
  wallet: Wallet;
};
