import { DomainError } from "./domain.error";

export class InvalidServerSeedError extends DomainError {
  readonly code = "INVALID_SERVER_SEED";

  constructor(message = "Revealed server seed does not match committed hash") {
    super(message);
  }
}
