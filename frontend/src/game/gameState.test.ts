import { describe, expect, it } from "bun:test";
import type { RoundDto } from "../api/types";
import type { GameEvent } from "../realtime/events";
import { initialState, reducer } from "./gameState";
import type { GameState } from "./gameState";

function makeRound(overrides: Partial<RoundDto> = {}): RoundDto {
  return {
    id: "round-1",
    nonce: 1,
    status: "RUNNING",
    serverSeedHash: "hash-1",
    serverSeed: null,
    crashPoint: null,
    liveMultiplier: 1.5,
    bettingEndsAt: "2026-06-22T12:00:00.000Z",
    startedAt: "2026-06-22T12:00:05.000Z",
    crashedAt: null,
    bets: [],
    ...overrides,
  };
}

describe("reducer / seedRound", () => {
  it("sai de connecting para betting quando nao ha rodada", () => {
    const next = reducer(initialState, { kind: "seedRound", round: null });
    expect(next.phase).toBe("betting");
  });

  it("mapeia os campos da rodada e deriva a fase pelo status", () => {
    const next = reducer(initialState, {
      kind: "seedRound",
      round: makeRound({ status: "RUNNING", liveMultiplier: 2.3 }),
    });
    expect(next.phase).toBe("running");
    expect(next.roundId).toBe("round-1");
    expect(next.multiplier).toBe(2.3);
    expect(next.serverSeedHash).toBe("hash-1");
  });

  it("mapeia apostas existentes da rodada", () => {
    const round = makeRound({
      bets: [
        {
          id: "bet-1",
          roundId: "round-1",
          username: "player",
          amountCents: "1000",
          amount: "10.00",
          status: "ACTIVE",
          cashOutMultiplier: null,
          payoutCents: null,
          payout: null,
          createdAt: "2026-06-22T12:00:01.000Z",
          settledAt: null,
        },
      ],
    });
    const next = reducer(initialState, { kind: "seedRound", round });
    expect(next.bets).toHaveLength(1);
    expect(next.bets[0]?.betId).toBe("bet-1");
    expect(next.bets[0]?.status).toBe("ACTIVE");
  });
});

describe("reducer / seedHistory", () => {
  const items = [{ roundId: "r1", crashPoint: 1.8, nonce: 1 }];

  it("preenche o historico quando esta vazio", () => {
    const next = reducer(initialState, { kind: "seedHistory", items });
    expect(next.history).toEqual(items);
  });

  it("nao sobrescreve um historico ja preenchido", () => {
    const seeded: GameState = { ...initialState, history: items };
    const next = reducer(seeded, {
      kind: "seedHistory",
      items: [{ roundId: "r2", crashPoint: 5, nonce: 2 }],
    });
    expect(next.history).toEqual(items);
  });
});

describe("reducer / eventos de rodada", () => {
  it("round.betting reinicia o estado para apostas", () => {
    const dirty: GameState = {
      ...initialState,
      phase: "crashed",
      multiplier: 7,
      bets: [
        {
          betId: "old",
          username: "x",
          amountCents: "100",
          status: "LOST",
          cashOutMultiplier: null,
          payoutCents: null,
        },
      ],
    };
    const event: GameEvent = {
      type: "round.betting",
      roundId: "round-2",
      nonce: 2,
      serverSeedHash: "hash-2",
      bettingEndsAt: "2026-06-22T12:01:00.000Z",
      bettingDurationMs: 10000,
    };
    const next = reducer(dirty, { kind: "event", event });
    expect(next.phase).toBe("betting");
    expect(next.roundId).toBe("round-2");
    expect(next.multiplier).toBe(1);
    expect(next.bets).toEqual([]);
    expect(next.serverSeed).toBeNull();
  });

  it("round.started so muda a fase se o roundId casar", () => {
    const running: GameState = { ...initialState, roundId: "round-1", phase: "betting" };
    const matched = reducer(running, {
      kind: "event",
      event: { type: "round.started", roundId: "round-1", startedAt: "2026-06-22T12:00:05.000Z" },
    });
    expect(matched.phase).toBe("running");

    const ignored = reducer(running, {
      kind: "event",
      event: { type: "round.started", roundId: "outra", startedAt: "2026-06-22T12:00:05.000Z" },
    });
    expect(ignored.phase).toBe("betting");
  });

  it("round.tick atualiza o multiplicador da rodada corrente e ignora outras", () => {
    const base: GameState = { ...initialState, roundId: "round-1", phase: "running" };
    const tick = reducer(base, {
      kind: "event",
      event: {
        type: "round.tick",
        roundId: "round-1",
        multiplier: 3.14,
        multiplierHundredths: 314,
        elapsedMs: 500,
      },
    });
    expect(tick.multiplier).toBe(3.14);

    const stale = reducer(base, {
      kind: "event",
      event: {
        type: "round.tick",
        roundId: "outra",
        multiplier: 99,
        multiplierHundredths: 9900,
        elapsedMs: 1,
      },
    });
    expect(stale.multiplier).toBe(1);
  });

  it("round.crashed revela a seed e adiciona ao historico", () => {
    const base: GameState = { ...initialState, roundId: "round-1", phase: "running", multiplier: 4 };
    const next = reducer(base, {
      kind: "event",
      event: {
        type: "round.crashed",
        roundId: "round-1",
        nonce: 1,
        crashPoint: 4.2,
        crashPointHundredths: 420,
        serverSeed: "seed-revelada",
        serverSeedHash: "hash-1",
        crashedAt: "2026-06-22T12:00:30.000Z",
      },
    });
    expect(next.phase).toBe("crashed");
    expect(next.crashPoint).toBe(4.2);
    expect(next.serverSeed).toBe("seed-revelada");
    expect(next.history[0]).toEqual({ roundId: "round-1", crashPoint: 4.2, nonce: 1 });
  });
});

describe("reducer / eventos de aposta", () => {
  const base: GameState = { ...initialState, roundId: "round-1" };

  function betEvent(type: "bet.placed" | "bet.settled", status: string): GameEvent {
    return {
      type,
      bet: {
        betId: "bet-1",
        roundId: "round-1",
        username: "player",
        amountCents: "1000",
        status,
        cashOutMultiplier: status === "CASHED_OUT" ? 2.5 : null,
        payoutCents: status === "CASHED_OUT" ? "2500" : null,
      },
    } as GameEvent;
  }

  it("bet.placed adiciona a aposta", () => {
    const next = reducer(base, { kind: "event", event: betEvent("bet.placed", "PENDING") });
    expect(next.bets).toHaveLength(1);
    expect(next.bets[0]?.status).toBe("PENDING");
  });

  it("bet.settled atualiza a mesma aposta sem duplicar", () => {
    const placed = reducer(base, { kind: "event", event: betEvent("bet.placed", "ACTIVE") });
    const settled = reducer(placed, { kind: "event", event: betEvent("bet.settled", "CASHED_OUT") });
    expect(settled.bets).toHaveLength(1);
    expect(settled.bets[0]?.status).toBe("CASHED_OUT");
    expect(settled.bets[0]?.cashOutMultiplier).toBe(2.5);
  });

  it("ignora apostas de outra rodada", () => {
    const event = {
      type: "bet.placed",
      bet: {
        betId: "bet-x",
        roundId: "round-9",
        username: "outro",
        amountCents: "500",
        status: "ACTIVE",
        cashOutMultiplier: null,
        payoutCents: null,
      },
    } as GameEvent;
    const next = reducer(base, { kind: "event", event });
    expect(next.bets).toHaveLength(0);
  });
});
