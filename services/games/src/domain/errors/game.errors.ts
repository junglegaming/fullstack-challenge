export abstract class GameDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidMoneyError extends GameDomainError {}

export class BetOutsideBettingPhaseError extends GameDomainError {
  constructor() {
    super("Bets can only be placed during the betting phase");
  }
}

export class DuplicateBetError extends GameDomainError {
  constructor() {
    super("Player already has a bet in this round");
  }
}

export class BetAmountOutOfRangeError extends GameDomainError {
  constructor(minCents: bigint, maxCents: bigint) {
    super(
      `Bet amount must be between ${minCents} and ${maxCents} cents (inclusive)`,
    );
  }
}

export class CashOutOutsideRunningPhaseError extends GameDomainError {
  constructor() {
    super("Cash out is only allowed while the round is running");
  }
}

export class NoActiveBetError extends GameDomainError {
  constructor() {
    super("Player has no active bet to cash out in this round");
  }
}

export class BetNotCashableError extends GameDomainError {
  constructor(status: string) {
    super(`Bet in status '${status}' cannot be cashed out`);
  }
}

export class InvalidRoundTransitionError extends GameDomainError {
  constructor(from: string, to: string) {
    super(`Invalid round transition: ${from} -> ${to}`);
  }
}

export class NoActiveRoundError extends GameDomainError {
  constructor() {
    super("There is no active round right now");
  }
}
