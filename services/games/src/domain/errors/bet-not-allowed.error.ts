import { DomainError } from "./domain.error";

export class BetNotAllowedError extends DomainError {
  readonly code = "BET_NOT_ALLOWED";

  constructor(message: string) {
    super(message);
  }
}
