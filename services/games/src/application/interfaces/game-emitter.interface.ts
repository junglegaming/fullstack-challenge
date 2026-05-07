// services/games/src/application/interfaces/game-emitter.interface.ts

export interface IGameEmitter {
  // Altere de (roundId: string) para:
  emitRoundStarted(roundId: string, hash: string): void;
  
  emitMultiplier(multiplier: number): void;
  
  // Aproveite e já prepare o emitCrash para o Passo 7 (receber o crashPoint e a seed)
  emitCrash(crashPoint: number, serverSeed: string): void;
}