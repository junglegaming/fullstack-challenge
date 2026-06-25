import { Injectable } from "@nestjs/common";
import { Bet } from "../../domain/entities/bet.entity";
import { GameEngine } from "../game-engine.service";

@Injectable()
export class CashOutUseCase {
  constructor(private readonly engine: GameEngine) {}

  execute(playerId: string): Promise<Bet> {
    return this.engine.cashOut(playerId);
  }
}
