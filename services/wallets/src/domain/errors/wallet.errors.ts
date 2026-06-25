export abstract class WalletDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidMoneyError extends WalletDomainError {}

export class InsufficientFundsError extends WalletDomainError {
  constructor(
    public readonly requiredCents: bigint,
    public readonly availableCents: bigint,
  ) {
    super(
      `Insufficient funds: required ${requiredCents} cents, available ${availableCents} cents`,
    );
  }
}

export class NonPositiveAmountError extends WalletDomainError {
  constructor() {
    super("Credit/debit amount must be strictly positive");
  }
}
