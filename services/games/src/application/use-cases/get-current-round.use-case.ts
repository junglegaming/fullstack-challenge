import { Injectable } from "@nestjs/common";
import { Round } from "../../domain/entities/round.aggregate";
import { Multiplier } from "../../domain/value-objects/multiplier.vo";
import { GameEngine } from "../game-engine.service";

export interface CurrentRoundView {
  round: Round | null;
  liveMultiplier: Multiplier;
}

@Injectable()
export class GetCurrentRoundUseCase {
  constructor(private readonly engine: GameEngine) {}

  execute(): CurrentRoundView {
    return {
      round: this.engine.getCurrentRound(),
      liveMultiplier: this.engine.getLiveMultiplier(),
    };
  }
}
