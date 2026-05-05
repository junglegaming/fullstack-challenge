import { Round } from '@/domain/entities/round.entity';
import { RoundRepository } from '@/domain/repositories/round.repository';

export class RoundRepositoryImpl implements RoundRepository {
  private currentRound: Round | null = null;

  async getCurrent(): Promise<Round> {
    if (!this.currentRound) {
      throw new Error('No active round found');
    }
    return this.currentRound;
  }

  async save(round: Round): Promise<void> {
    this.currentRound = round;
  }

  setCurrentRound(round: Round): void {
    this.currentRound = round;
  }
}
