import { DomainError } from "./domain.error";

export class InvalidBetTransitionError extends DomainError {
  readonly code = "INVALID_BET_TRANSITION";

  constructor(from: string, to: string) {
    super(`Invalid bet transition from ${from} to ${to}`);
  }
}
