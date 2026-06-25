import { Injectable } from "@nestjs/common";
import { Bet } from "../../domain/entities/bet.entity";
import { Money } from "../../domain/value-objects/money.vo";
import { GameEngine } from "../game-engine.service";

export interface PlaceBetInput {
  playerId: string;
  username: string;

  amount: string;
}

@Injectable()
export class PlaceBetUseCase {
  constructor(private readonly engine: GameEngine) {}

  execute(input: PlaceBetInput): Promise<Bet> {

    const amount = Money.fromDecimalString(input.amount);
    return this.engine.placeBet({
      playerId: input.playerId,
      username: input.username,
      amount,
    });
  }
}
