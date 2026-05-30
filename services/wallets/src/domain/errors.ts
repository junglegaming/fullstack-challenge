export class InsufficientFundsError extends Error {
  constructor() {
    super("Insufficient available balance to fulfill the reservation");
    this.name = "InsufficientFundsError";
  }
}

export class ReservationNotFoundError extends Error {
  constructor(reservationId: string) {
    super(`No active reservation found for reservationId: ${reservationId}`);
    this.name = "ReservationNotFoundError";
  }
}

export class DuplicateReservationError extends Error {
  constructor(reservationId: string) {
    super(`A reservation for reservationId ${reservationId} already exists`);
    this.name = "DuplicateReservationError";
  }
}
