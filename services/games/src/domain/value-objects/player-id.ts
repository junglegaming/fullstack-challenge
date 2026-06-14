export class PlayerId {
  private constructor(private readonly value: string) {}

  static create(value: string): PlayerId {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error("Player id cannot be empty");
    }

    return new PlayerId(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }
}
