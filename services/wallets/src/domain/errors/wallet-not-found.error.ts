import { DomainError } from "./domain.error";

export class WalletNotFoundError extends DomainError {
  readonly code = "WALLET_NOT_FOUND";

  constructor(playerId: string) {
    super(`Wallet not found for player ${playerId}`);
  }
}
