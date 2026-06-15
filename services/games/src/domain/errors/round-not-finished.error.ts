import { DomainError } from "./domain.error";

export class RoundNotFinishedError extends DomainError {
  readonly code = "ROUND_NOT_FINISHED";

  constructor(message = "Round must be crashed or settled before verification") {
    super(message);
  }
}
