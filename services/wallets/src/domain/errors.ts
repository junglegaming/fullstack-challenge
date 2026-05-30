export class InsufficientFundsError extends Error {
  constructor() {
    super("Insufficient available balance to fulfill the reservation");
    this.name = "InsufficientFundsError";
  }
}

export class ReservationNotFoundError extends Error {
  constructor(betId: string) {
    super(`No active reservation found for betId: ${betId}`);
    this.name = "ReservationNotFoundError";
  }
}

export class DuplicateReservationError extends Error {
  constructor(betId: string) {
    super(`A reservation for betId ${betId} has already been processed`);
    this.name = "DuplicateReservationError";
  }
}
