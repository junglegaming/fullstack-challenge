import { DomainError } from "./domain.error";

export class InsufficientBalanceError extends DomainError {
  readonly code = "INSUFFICIENT_BALANCE";

  constructor(message = "Insufficient wallet balance for debit") {
    super(message);
  }
}
