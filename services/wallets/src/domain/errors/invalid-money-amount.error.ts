import { DomainError } from "./domain.error";

export class InvalidMoneyAmountError extends DomainError {
  readonly code = "INVALID_MONEY_AMOUNT";

  constructor(message = "Money amount must be a non-negative integer in cents") {
    super(message);
  }
}
