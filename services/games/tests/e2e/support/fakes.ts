import type { GameEventsPublisher } from "../../../src/application/ports/game-events.publisher";
import type { IdGenerator } from "../../../src/application/ports/id-generator";
import type { RoundRepository } from "../../../src/application/ports/round.repository";
import type {
  SeedChainProvider,
  SeedForNonce,
} from "../../../src/application/ports/seed-chain.provider";
import type {
  CreditRequest,
  DebitRequest,
  WalletGateway,
} from "../../../src/application/ports/wallet.gateway";
import type { GameEvent } from "../../../src/application/events/game-events";
import type { Bet } from "../../../src/domain/entities/bet.entity";
import type { Round } from "../../../src/domain/entities/round.aggregate";
import { RoundStatus } from "../../../src/domain/entities/round-status";
import { serverSeedHash, sha256Hex } from "../../../src/domain/services/provably-fair";

export class FakeWalletGateway implements WalletGateway {
  readonly debits: DebitRequest[] = [];
  readonly credits: CreditRequest[] = [];

  requestDebit(request: DebitRequest): void {
    this.debits.push(request);
  }

  requestCredit(request: CreditRequest): void {
    this.credits.push(request);
  }
}

export class FakeEventsPublisher implements GameEventsPublisher {
  readonly events: GameEvent[] = [];

  publish(event: GameEvent): void {
    this.events.push(event);
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }
}

export class FakeSeedProvider implements SeedChainProvider {
  async ensureInitialized(): Promise<void> {}

  async getSeedForNonce(nonce: number): Promise<SeedForNonce> {
    const serverSeed = sha256Hex(`fake-seed:${nonce}`);
    return { serverSeed, serverSeedHash: serverSeedHash(serverSeed) };
  }
}

export class InMemoryRoundRepository implements RoundRepository {
  private readonly rounds = new Map<string, Round>();

  async save(round: Round): Promise<void> {
    this.rounds.set(round.id, round);
  }

  async findById(id: string): Promise<Round | null> {
    return this.rounds.get(id) ?? null;
  }

  async findHistory(limit: number, offset: number): Promise<Round[]> {
    return [...this.rounds.values()]
      .filter((round) => round.getStatus() === RoundStatus.CRASHED)
      .sort((a, b) => b.nonce - a.nonce)
      .slice(offset, offset + limit);
  }

  async countFinishedRounds(): Promise<number> {
    return [...this.rounds.values()].filter(
      (round) => round.getStatus() === RoundStatus.CRASHED,
    ).length;
  }

  async findMaxNonce(): Promise<number | null> {
    const nonces = [...this.rounds.values()].map((round) => round.nonce);
    return nonces.length ? Math.max(...nonces) : null;
  }

  async findBetsByPlayer(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<Bet[]> {
    return this.allBets()
      .filter((bet) => bet.playerId === playerId)
      .slice(offset, offset + limit);
  }

  async countBetsByPlayer(playerId: string): Promise<number> {
    return this.allBets().filter((bet) => bet.playerId === playerId).length;
  }

  private allBets(): Bet[] {
    return [...this.rounds.values()].flatMap((round) => round.getBets());
  }
}
