import { Round } from '../entities/round.entity';

export interface RoundRepository {
  getCurrent(): Promise<Round>;
  save(round: Round): Promise<void>;
}
