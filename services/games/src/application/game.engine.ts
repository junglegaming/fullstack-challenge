import { Round } from "../domain/entities/round.entity"
import { RoundStatus } from "../domain/enum/round-status.enum"
import { IGameEmitter } from "./interfaces/game-emitter.interface";
import { RoundService } from "./service/round.service"
import { Injectable } from "@nestjs/common"
import * as crypto from 'node:crypto';


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

  // 1. Gera a semente (Importante usar o crypto do Node aqui)
  const serverSeed = crypto.randomBytes(32).toString('hex');

  // 2. USA A ENTIDADE! (É aqui que o erro morre)
  // O Round.create já vai calcular o crashPoint e o Hash internamente
  this.currentRound = Round.create(crypto.randomUUID(), serverSeed);

  console.log(`🟡 Rodada Criada: ${this.currentRound.id}`);
  console.log(`🎯 O Crash será em: ${this.currentRound.crashPoint}x`); // Confira se aqui aparece um número variado!

  // 3. Avisa o Gateway
  this.emitter?.emitRoundStarted(this.currentRound.id, this.currentRound.serverSeedHash);

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

  this.roundService.setCurrentRound(this.currentRound);
  
  // LOG PARA VOCÊ CONFERIR NO TERMINAL
  console.log(`💥 Crashed at ${this.currentMultiplier.toFixed(2)}x`);
  console.log(`🔑 Revelando a Seed: ${this.currentRound.serverSeed}`);

  // ENVIAR PARA O EMITTER (Passo 7)
  // O seu emitCrash precisa receber esses dois valores
  this.emitter?.emitCrash(
    this.currentRound.crashPoint, 
    this.currentRound.serverSeed
  );
  
  this.activeBets.clear();
  
  // Intervalo de 5 segundos para a próxima rodada
  setTimeout(() => this.startBettingPhase(), 5000);
}

  // private generateCrashPoint(): number {
  //   return Number((Math.random() * 10 + 1).toFixed(2));
  // }
}