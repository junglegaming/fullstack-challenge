import { DomainError } from "./domain.error";

export class InvalidRoundTransitionError extends DomainError {
  readonly code = "INVALID_ROUND_TRANSITION";

  constructor(from: string, to: string) {
    super(`Invalid round transition from ${from} to ${to}`);
  }
}
