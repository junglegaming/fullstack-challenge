import { GameRepository } from "@/infrastructure/repositories/game.repository";
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
  
  private emitter: IGameEmitter | null = null;

  constructor(
    private roundService: RoundService,
    private gameRepository: GameRepository
  ) {}

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
    console.log('--- DEBUG CASHOUT ---');
    console.log('Buscando PlayerId:', playerId);
    console.log('Jogadores na memória:', Array.from(this.activeBets.keys()));
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

private async startBettingPhase() { 
  this.activeBets.clear();

  const serverSeed = crypto.randomBytes(32).toString('hex');


  this.currentRound = Round.create(crypto.randomUUID(), serverSeed);

  this.roundService.setCurrentRound(this.currentRound);

  console.log(`🟡 Rodada Criada: ${this.currentRound.id}`);
  
  try {
    await this.gameRepository.createRound(this.currentRound);
  } catch (error) {
    console.error('❌ Erro ao persistir rodada:', error);
  }

  this.emitter?.emitRoundStarted(this.currentRound.id, this.currentRound.serverSeedHash);

  setTimeout(() => this.startRound(), 10000);
}

  private startRound() {
  if (!this.currentRound) return;

  console.log(`🚀 Round started | Target: ${this.currentRound.crashPoint}x`);
  this.currentRound.start();
  
  this.currentMultiplier = 1.0;


  const interval = setInterval(() => {
  
    this.currentMultiplier += 0.05;

    console.log(`Tick: ${this.currentMultiplier.toFixed(2)}x`);

    this.emitter?.emitMultiplier(this.currentMultiplier);

    if (this.currentMultiplier >= this.currentRound!.crashPoint) {
      console.log('--- Triggering Crash ---');
      clearInterval(interval);
      this.crashRound();
    }
  }, 100);
}

private async crashRound() {
  if (!this.currentRound) return;
  
  this.currentRound.crash();
  
  try {
    await this.gameRepository.markPendingBetsAsLost(this.currentRound.id);
  } catch (error) {
    console.error('❌ Erro ao atualizar apostas perdidas:', error);
  }

  this.roundService.setCurrentRound(this.currentRound);
  
  console.log(`💥 Crashed at ${this.currentMultiplier.toFixed(2)}x`);
  console.log(`🔑 Revelando a Seed: ${this.currentRound.serverSeed}`);

  this.emitter?.emitCrash(
    this.currentRound.crashPoint, 
    this.currentRound.serverSeed
  );

  this.activeBets.clear();
  
  setTimeout(() => this.startBettingPhase(), 5000);
}


  
}