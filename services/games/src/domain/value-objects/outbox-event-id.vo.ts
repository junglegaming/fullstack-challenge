export class OutboxEventId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) throw new Error('OutboxEventId cannot be empty');
    this.value = value;
  }

  get raw(): string {
    return this.value;
  }

  equals(other: OutboxEventId): boolean {
    return this.value === other.value;
  }
}
