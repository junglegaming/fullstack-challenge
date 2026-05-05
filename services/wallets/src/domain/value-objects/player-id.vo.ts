export class PlayerId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) throw new Error('PlayerId cannot be empty');
    this.value = value;
  }

  get raw(): string {
    return this.value;
  }

  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }
}
