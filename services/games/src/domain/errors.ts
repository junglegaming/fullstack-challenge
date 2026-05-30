export class BettingClosedError extends Error {
  constructor() {
    super("Bets are only accepted during the BETTING phase");
    this.name = "BettingClosedError";
  }
}

export class BetAlreadyPlacedError extends Error {
  constructor(playerId: string) {
    super(`Player ${playerId} already has a bet in this round`);
    this.name = "BetAlreadyPlacedError";
  }
}

export class CashoutNotAllowedError extends Error {
  constructor() {
    super("Cashout is only allowed during the RUNNING phase");
    this.name = "CashoutNotAllowedError";
  }
}

export class BetNotFoundError extends Error {
  constructor(playerId: string) {
    super(`No active bet found for player ${playerId} in this round`);
    this.name = "BetNotFoundError";
  }
}

export class AlreadyCashedOutError extends Error {
  constructor(betId: string) {
    super(`Bet ${betId} has already been cashed out`);
    this.name = "AlreadyCashedOutError";
  }
}

export class InvalidRoundStateError extends Error {
  constructor(expected: string, actual: string) {
    super(`Invalid round state transition: expected ${expected}, got ${actual}`);
    this.name = "InvalidRoundStateError";
  }
}
