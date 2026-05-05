export class WalletId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) throw new Error('WalletId cannot be empty');
    this.value = value;
  }

  get raw(): string {
    return this.value;
  }

  equals(other: WalletId): boolean {
    return this.value === other.value;
  }
}
