import { DomainError } from "./domain.error";

export class BetNotFoundError extends DomainError {
  readonly code = "BET_NOT_FOUND";

  constructor(playerId: string) {
    super(`Bet not found for player ${playerId}`);
  }
}
