import { Round } from "../../domain/entities/round";
import { PlayerId } from "../../domain/value-objects/player-id";
import { RoundId } from "../../domain/value-objects/round-id";
import { Bet } from "../../domain/entities/bet";

export const GAME_ROUNDS_REPOSITORY = Symbol("GAME_ROUNDS_REPOSITORY");

export type RoundHistoryPage = {
  items: Round[];
  total: number;
};

export interface GameRoundsRepository {
  findCurrent(): Promise<Round>;
  findById(roundId: RoundId): Promise<Round | null>;
  listHistory(input: { page: number; pageSize: number }): Promise<RoundHistoryPage>;
  findBetsByPlayer(playerId: PlayerId): Promise<Bet[]>;
  save(round: Round): Promise<void>;
}
