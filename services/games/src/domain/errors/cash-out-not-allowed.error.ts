import { DomainError } from "./domain.error";

export class CashOutNotAllowedError extends DomainError {
  readonly code = "CASH_OUT_NOT_ALLOWED";

  constructor(message: string) {
    super(message);
  }
}
