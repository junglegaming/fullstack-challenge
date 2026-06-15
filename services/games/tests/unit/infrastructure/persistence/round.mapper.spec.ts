import { describe, expect, it } from "bun:test";
import { Round } from "../../../../src/domain/entities/round";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";
import { RoundStatus } from "../../../../src/domain/value-objects/round-status";
import { RoundMapper } from "../../../../src/infrastructure/persistence/prisma/mappers/round.mapper";

describe("RoundMapper", () => {
  it("maps hidden server seed for active rounds", () => {
    const provablyFairService = new ProvablyFairService();
    const bettingRound = Round.createProvablyFair({
      provablyFairService,
      clientSeed: "crash-game-public-seed",
      nonce: 1,
      bettingStartedAt: new Date("2026-06-14T12:00:00.000Z"),
      bettingEndsAt: new Date("2026-06-14T12:00:10.000Z"),
    });

    const persistence = RoundMapper.toPersistenceCreate(bettingRound);

    expect(persistence.serverSeed).toBeString();
    expect(bettingRound.serverSeed).toBeNull();

    const domain = RoundMapper.toDomain({
      ...persistence,
      status: RoundStatus.BETTING,
      serverSeed: persistence.serverSeed,
      startedAt: null,
      crashedAt: null,
      settledAt: null,
      bets: [],
    });

    expect(domain.serverSeed).toBeNull();
    expect(domain.getStoredServerSeed()).toBe(persistence.serverSeed);
  });

  it("maps revealed server seed for settled rounds", () => {
    const record = {
      id: "round-1",
      status: RoundStatus.SETTLED,
      serverSeedHash: "hash",
      serverSeed: "revealed-seed",
      clientSeed: "client-seed",
      nonce: 42,
      crashPointBps: 107,
      bettingEndsAt: new Date("2026-06-14T12:00:10.000Z"),
      startedAt: new Date("2026-06-14T12:00:11.000Z"),
      crashedAt: new Date("2026-06-14T12:00:20.000Z"),
      settledAt: new Date("2026-06-14T12:00:21.000Z"),
      createdAt: new Date("2026-06-14T12:00:00.000Z"),
      updatedAt: new Date("2026-06-14T12:00:21.000Z"),
      bets: [],
    };

    const domain = RoundMapper.toDomain(record);

    expect(domain.serverSeed).toBe("revealed-seed");
    expect(domain.bettingStartedAt.toISOString()).toBe(record.createdAt.toISOString());
  });
});
