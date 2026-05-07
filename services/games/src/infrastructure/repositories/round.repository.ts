import { Round } from "@/domain/entities/round.entity";

export interface RoundRepository {
  getCurrent(): Promise<Round>;
  save(round: Round): Promise<void>;
}