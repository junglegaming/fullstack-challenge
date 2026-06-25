import { Bet } from "../../domain/entities/bet.entity";
import { Round } from "../../domain/entities/round.aggregate";

export const ROUND_REPOSITORY = Symbol("ROUND_REPOSITORY");

export interface RoundRepository {

  save(round: Round): Promise<void>;
  findById(id: string): Promise<Round | null>;

  findHistory(limit: number, offset: number): Promise<Round[]>;
  countFinishedRounds(): Promise<number>;

  findMaxNonce(): Promise<number | null>;

  findBetsByPlayer(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<Bet[]>;
  countBetsByPlayer(playerId: string): Promise<number>;
}
