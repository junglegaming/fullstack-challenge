export class BetId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) throw new Error('BetId cannot be empty');
    this.value = value;
  }

  get raw(): string {
    return this.value;
  }

  equals(other: BetId): boolean {
    return this.value === other.value;
  }
}
