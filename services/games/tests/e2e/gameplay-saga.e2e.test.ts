import { beforeEach, describe, expect, it } from "bun:test";
import type { ConfigService } from "@nestjs/config";
import { GameConfig } from "../../src/application/game-config";
import { GameEngine } from "../../src/application/game-engine.service";
import { Round } from "../../src/domain/entities/round.aggregate";
import { BetStatus } from "../../src/domain/entities/bet-status";
import { Money } from "../../src/domain/value-objects/money.vo";
import { Multiplier } from "../../src/domain/value-objects/multiplier.vo";
import { crashPointHundredths, serverSeedHash, sha256Hex } from "../../src/domain/services/provably-fair";
import {
  FakeEventsPublisher,
  FakeWalletGateway,
  InMemoryRoundRepository,
  SequentialIdGenerator,
} from "./support/fakes";

describe("Gameplay saga (e2e)", () => {
  let repo: InMemoryRoundRepository;
  let wallet: FakeWalletGateway;
  let events: FakeEventsPublisher;
  let engine: GameEngine;
  const config = new GameConfig({ get: () => undefined } as unknown as ConfigService);
  const now = new Date("2026-01-01T00:00:00Z");

  function installRound(nonce = 0): Round {
    const serverSeed = sha256Hex(`fake-seed:${nonce}`);
    const crash = crashPointHundredths(serverSeed, nonce, {
      houseEdge: config.houseEdge,
      maxHundredths: config.maxMultiplierHundredths,
    });
    const round = Round.open({
      id: `round-${nonce}`,
      nonce,
      serverSeed,
      serverSeedHash: serverSeedHash(serverSeed),
      crashPoint: Multiplier.fromHundredths(crash),
      now,
      bettingEndsAt: new Date(now.getTime() + 8000),
    });
    (engine as unknown as { currentRound: Round }).currentRound = round;
    return round;
  }

  function startRound(): void {
    const round = (engine as unknown as { currentRound: Round }).currentRound;
    round.start(now);
    (engine as unknown as { roundStartedAtMs: number }).roundStartedAtMs =
      Date.now() - 500;
  }

  beforeEach(() => {
    repo = new InMemoryRoundRepository();
    wallet = new FakeWalletGateway();
    events = new FakeEventsPublisher();
    engine = new GameEngine(
      config,
      repo,
      { ensureInitialized: async () => {}, getSeedForNonce: async () => ({ serverSeed: "", serverSeedHash: "" }) },
      wallet,
      events,
      new SequentialIdGenerator(),
    );
  });

  it("funds a bet on debit success (bet -> ACTIVE)", async () => {
    const round = installRound();
    const bet = await engine.placeBet({
      playerId: "p1",
      username: "alice",
      amount: Money.fromDecimalString("10.00"),
    });
    expect(bet.getStatus()).toBe(BetStatus.PENDING);
    expect(wallet.debits).toHaveLength(1);
    expect(wallet.debits[0]?.amountCents).toBe("1000");

    await engine.onDebitSucceeded(round.id, bet.id);
    expect(round.getBetById(bet.id)?.getStatus()).toBe(BetStatus.ACTIVE);
  });

  it("rejects a bet on debit failure (bet -> REJECTED), no funds moved", async () => {
    const round = installRound();
    const bet = await engine.placeBet({
      playerId: "p1",
      username: "alice",
      amount: Money.fromDecimalString("10.00"),
    });
    await engine.onDebitFailed(round.id, bet.id);
    expect(round.getBetById(bet.id)?.getStatus()).toBe(BetStatus.REJECTED);
    expect(wallet.credits).toHaveLength(0);
  });

  it("pays out a cash out and requests the credit (bet -> CASHED_OUT)", async () => {
    const round = installRound();
    const bet = await engine.placeBet({
      playerId: "p1",
      username: "alice",
      amount: Money.fromDecimalString("10.00"),
    });
    await engine.onDebitSucceeded(round.id, bet.id);
    startRound();

    const cashedOut = await engine.cashOut("p1");
    expect(cashedOut.getStatus()).toBe(BetStatus.CASHED_OUT);
    expect(wallet.credits).toHaveLength(1);

    const payout = cashedOut.getPayout();
    expect(payout).not.toBeNull();
    expect(wallet.credits[0]?.amountCents).toBe(payout?.toCents().toString());

    expect(payout?.toCents()).toBeGreaterThanOrEqual(1000n);
  });

  it("marks an active bet as lost on crash and never credits it", async () => {
    const round = installRound();
    const bet = await engine.placeBet({
      playerId: "p1",
      username: "alice",
      amount: Money.fromDecimalString("10.00"),
    });
    await engine.onDebitSucceeded(round.id, bet.id);
    startRound();

    const lost = round.crash(new Date());
    await repo.save(round);

    expect(lost).toHaveLength(1);
    expect(round.getBetById(bet.id)?.getStatus()).toBe(BetStatus.LOST);
    expect(wallet.credits).toHaveLength(0);
  });
});
