export interface IGameEmitter {
  emitBettingStarted(): void;

  emitRoundStarted(roundId: string, hash: string): void;
  
  emitMultiplier(multiplier: number): void;
  
  emitCrash(crashPoint: number, serverSeed: string): void;

  // 💡 ADICIONE ESTAS DUAS ASSINATURAS AQUI:
  emitBetPlaced(playerId: string, amount: bigint): void;
  
  emitCashoutDone(playerId: string, profit: bigint): void;
}