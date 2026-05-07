export interface IGameEmitter {
  emitRoundStarted(roundId: string): void;
  emitMultiplier(multiplier: number): void;
  emitCrash(multiplier: number): void;
}