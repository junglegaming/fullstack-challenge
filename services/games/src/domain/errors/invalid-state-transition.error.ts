import { RoundStatus } from '../enums/round-status.enum';

export class InvalidStateTransitionError extends Error {
  constructor(from: RoundStatus, to: RoundStatus) {
    super(`Invalid state transition: ${from} → ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}
