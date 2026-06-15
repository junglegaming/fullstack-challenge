import { DomainError } from "./domain.error";

export class InvalidBetAmountError extends DomainError {
  readonly code = "INVALID_BET_AMOUNT";

  constructor(message = "Bet amount must be between 1.00 and 1,000.00") {
    super(message);
  }
}
