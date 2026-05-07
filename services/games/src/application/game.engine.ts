import { Round } from "../domain/entities/round.entity"
import { RoundStatus } from "../domain/enum/round-status.enum"
import { IGameEmitter } from "./interfaces/game-emitter.interface";
import { RoundService } from "./service/round.service"
import { Injectable } from "@nestjs/common"


@Injectable()
export class GameEngine {
  private currentRound: Round | null = null;
  private currentMultiplier = 1;
  private activeBets = new Map<string, bigint>();
  
  // Aqui guardaremos quem vai emitir os sons/eventos (será o Gateway)
  private emitter: IGameEmitter | null = null;

  constructor(private roundService: RoundService) {}

  // Método para o Gateway se registrar como o emissor oficial
  setEmitter(emitter: IGameEmitter) {
    this.emitter = emitter;
  }

  start() {
    this.startBettingPhase();
  }

  placeBet(playerId: string, amount: bigint) {
    if (!this.currentRound || this.currentRound.status !== RoundStatus.BETTING) {
      throw new Error('As apostas estão fechadas para esta rodada!');
    }
    this.activeBets.set(playerId, amount);
    console.log(`✅ Aposta registrada: ${playerId} | Valor: ${amount}`);
  }

  async cashout(playerId: string) {
    const betAmount = this.activeBets.get(playerId);
    if (!betAmount || !this.currentRound || this.currentRound.status !== RoundStatus.RUNNING) {
      throw new Error('Impossível realizar cashout agora!');
    }

    const multiplier = this.currentMultiplier;
    const profit = BigInt(Math.floor(Number(betAmount) * multiplier));
    this.activeBets.delete(playerId);

    console.log(`💰 Cashout: ${playerId} saiu em ${multiplier.toFixed(2)}x`);
    return { playerId, paidMultiplier: multiplier, profit };
  }

  private startBettingPhase() {
    this.activeBets.clear();
    const crashPoint = this.generateCrashPoint();

    this.currentRound = new Round(crypto.randomUUID(), crashPoint);
    this.roundService.setCurrentRound(this.currentRound); 

    console.log('🟡 Betting phase started');
    
    // Usamos o emitter opcional
    this.emitter?.emitRoundStarted(this.currentRound.id);

    setTimeout(() => this.startRound(), 10000);
  }

  private startRound() {
  if (!this.currentRound) return;

  console.log(`🚀 Round started | Target: ${this.currentRound.crashPoint}x`);
  this.currentRound.start();
  
  // 1. Garantia: Reseta o multiplicador
  this.currentMultiplier = 1.0;

  // 2. Segurança: Limpa qualquer intervalo que possa ter ficado aberto (evita aceleração)
  // Se você tiver uma variável private gameInterval: any no topo da classe, use-a.

  const interval = setInterval(() => {
    // 3. Incremento
    this.currentMultiplier += 0.05;

    // 4. Debug: Vamos ver o número subir no terminal
    // Se isso não aparecer no terminal, o setInterval parou de rodar.
    console.log(`Tick: ${this.currentMultiplier.toFixed(2)}x`);

    this.emitter?.emitMultiplier(this.currentMultiplier);

    // 5. Verificação de Crash
    if (this.currentMultiplier >= this.currentRound!.crashPoint) {
      console.log('--- Triggering Crash ---');
      clearInterval(interval);
      this.crashRound();
    }
  }, 100);
}

  private crashRound() {
    if (!this.currentRound) return;
    this.currentRound.crash();
    this.activeBets.clear();
    console.log(`💥 Crashed at ${this.currentMultiplier.toFixed(2)}x`);
    this.emitter?.emitCrash(this.currentMultiplier);
    
    setTimeout(() => this.startBettingPhase(), 5000);
  }

  private generateCrashPoint(): number {
    return Number((Math.random() * 10 + 1).toFixed(2));
  }
}