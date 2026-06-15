import { DomainError } from "./domain.error";

export class WalletAlreadyExistsError extends DomainError {
  readonly code = "WALLET_ALREADY_EXISTS";

  constructor(playerId: string) {
    super(`Wallet already exists for player ${playerId}`);
  }
}
