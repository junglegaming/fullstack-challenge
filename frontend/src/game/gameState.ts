import type { BetStatus, RoundDto } from "../api/types";
import type { GameEvent } from "../realtime/events";

export type Phase = "connecting" | "betting" | "running" | "crashed";

export interface LiveBet {
  betId: string;
  username: string;
  amountCents: string;
  status: BetStatus;
  cashOutMultiplier: number | null;
  payoutCents: string | null;
}

export interface HistoryItem {
  roundId: string;
  crashPoint: number;
  nonce: number;
}

export interface GameState {
  phase: Phase;
  roundId: string | null;
  nonce: number | null;
  serverSeedHash: string | null;
  serverSeed: string | null;
  crashPoint: number | null;
  multiplier: number;
  bettingEndsAt: number | null;
  bettingDurationMs: number | null;
  startedAt: number | null;
  crashedAt: number | null;
  bets: LiveBet[];
  history: HistoryItem[];
}

export const initialState: GameState = {
  phase: "connecting",
  roundId: null,
  nonce: null,
  serverSeedHash: null,
  serverSeed: null,
  crashPoint: null,
  multiplier: 1,
  bettingEndsAt: null,
  bettingDurationMs: null,
  startedAt: null,
  crashedAt: null,
  bets: [],
  history: [],
};

const MAX_HISTORY = 30;

export type Action =
  | { kind: "seedRound"; round: RoundDto | null }
  | { kind: "seedHistory"; items: HistoryItem[] }
  | { kind: "event"; event: GameEvent };

function upsertBet(bets: LiveBet[], next: LiveBet): LiveBet[] {
  const idx = bets.findIndex((b) => b.betId === next.betId);
  if (idx === -1) {
    return [...bets, next];
  }
  const copy = bets.slice();
  copy[idx] = next;
  return copy;
}

function phaseFromStatus(status: RoundDto["status"]): Phase {
  if (status === "RUNNING") {
    return "running";
  }
  if (status === "CRASHED") {
    return "crashed";
  }
  return "betting";
}

function ms(iso: string | null): number | null {
  return iso ? Date.parse(iso) : null;
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.kind) {
    case "seedRound": {
      const round = action.round;
      if (!round) {

        return { ...state, phase: state.phase === "connecting" ? "betting" : state.phase };
      }
      return {
        ...state,
        phase: phaseFromStatus(round.status),
        roundId: round.id,
        nonce: round.nonce,
        serverSeedHash: round.serverSeedHash,
        serverSeed: round.serverSeed,
        crashPoint: round.crashPoint,
        multiplier: round.liveMultiplier,
        bettingEndsAt: ms(round.bettingEndsAt),
        startedAt: ms(round.startedAt),
        crashedAt: ms(round.crashedAt),
        bets: round.bets.map((b) => ({
          betId: b.id,
          username: b.username,
          amountCents: b.amountCents,
          status: b.status,
          cashOutMultiplier: b.cashOutMultiplier,
          payoutCents: b.payoutCents,
        })),
      };
    }

    case "seedHistory":

      return state.history.length ? state : { ...state, history: action.items };

    case "event":
      return applyEvent(state, action.event);

    default:
      return state;
  }
}

function applyEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case "round.betting":

      return {
        ...state,
        phase: "betting",
        roundId: event.roundId,
        nonce: event.nonce,
        serverSeedHash: event.serverSeedHash,
        serverSeed: null,
        crashPoint: null,
        multiplier: 1,
        bettingEndsAt: ms(event.bettingEndsAt),
        bettingDurationMs: event.bettingDurationMs,
        startedAt: null,
        crashedAt: null,
        bets: [],
      };

    case "round.started":
      if (event.roundId !== state.roundId) {
        return state;
      }
      return { ...state, phase: "running", startedAt: ms(event.startedAt) };

    case "round.tick":
      if (event.roundId !== state.roundId) {
        return state;
      }
      return {
        ...state,
        phase: state.phase === "crashed" ? "crashed" : "running",
        multiplier: event.multiplier,
      };

    case "round.crashed": {
      if (event.roundId !== state.roundId) {
        return state;
      }
      const item: HistoryItem = {
        roundId: event.roundId,
        crashPoint: event.crashPoint,
        nonce: event.nonce,
      };
      return {
        ...state,
        phase: "crashed",
        crashPoint: event.crashPoint,
        multiplier: event.crashPoint,
        serverSeed: event.serverSeed,
        serverSeedHash: event.serverSeedHash,
        crashedAt: ms(event.crashedAt),
        history: [item, ...state.history].slice(0, MAX_HISTORY),
      };
    }

    case "bet.placed":
    case "bet.settled": {
      const s = event.bet;

      if (state.roundId && s.roundId !== state.roundId) {
        return state;
      }
      return {
        ...state,
        bets: upsertBet(state.bets, {
          betId: s.betId,
          username: s.username,
          amountCents: s.amountCents,
          status: s.status as BetStatus,
          cashOutMultiplier: s.cashOutMultiplier,
          payoutCents: s.payoutCents,
        }),
      };
    }

    default:
      return state;
  }
}
