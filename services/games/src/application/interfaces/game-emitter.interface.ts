
export interface IGameEmitter {
  emitRoundStarted(roundId: string, hash: string): void;
  
  emitMultiplier(multiplier: number): void;
  
  emitCrash(crashPoint: number, serverSeed: string): void;
}