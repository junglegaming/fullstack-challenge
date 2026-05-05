export class TransactionId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) throw new Error('TransactionId cannot be empty');
    this.value = value;
  }

  get raw(): string {
    return this.value;
  }

  equals(other: TransactionId): boolean {
    return this.value === other.value;
  }
}
