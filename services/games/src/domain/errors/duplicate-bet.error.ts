import { DomainError } from "./domain.error";

export class DuplicateBetError extends DomainError {
  readonly code = "DUPLICATE_BET";

  constructor(playerId: string) {
    super(`Player ${playerId} already has a bet in this round`);
  }
}
