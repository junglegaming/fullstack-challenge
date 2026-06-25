export const GameEventType = {
  RoundBetting: "round.betting",
  RoundStarted: "round.started",
  RoundTick: "round.tick",
  RoundCrashed: "round.crashed",
  BetPlaced: "bet.placed",
  BetSettled: "bet.settled",
} as const;

export interface BetSnapshot {
  betId: string;
  roundId: string;
  username: string;
  amountCents: string;
  status: string;
  cashOutMultiplier: number | null;
  payoutCents: string | null;
}

export interface RoundBettingEvent {
  type: typeof GameEventType.RoundBetting;
  roundId: string;
  nonce: number;
  serverSeedHash: string;
  bettingEndsAt: string;
  bettingDurationMs: number;
}

export interface RoundStartedEvent {
  type: typeof GameEventType.RoundStarted;
  roundId: string;
  startedAt: string;
}

export interface RoundTickEvent {
  type: typeof GameEventType.RoundTick;
  roundId: string;
  multiplier: number;
  multiplierHundredths: number;
  elapsedMs: number;
}

export interface RoundCrashedEvent {
  type: typeof GameEventType.RoundCrashed;
  roundId: string;
  nonce: number;
  crashPoint: number;
  crashPointHundredths: number;
  serverSeed: string;
  serverSeedHash: string;
  crashedAt: string;
}

export interface BetPlacedEvent {
  type: typeof GameEventType.BetPlaced;
  bet: BetSnapshot;
}

export interface BetSettledEvent {
  type: typeof GameEventType.BetSettled;
  bet: BetSnapshot;
}

export type GameEvent =
  | RoundBettingEvent
  | RoundStartedEvent
  | RoundTickEvent
  | RoundCrashedEvent
  | BetPlacedEvent
  | BetSettledEvent;
