import type {
  BetAcceptedPayload,
  BetCashedOutPayload,
  RoundBettingStartedPayload,
  RoundCrashedPayload,
  RoundMultiplierTickPayload,
  RoundSettledPayload,
  RoundStartedPayload,
} from "../realtime/game-realtime-events";

export const GAME_REALTIME_PUBLISHER = Symbol("GAME_REALTIME_PUBLISHER");

export interface GameRealtimePublisher {
  publishRoundBettingStarted(payload: RoundBettingStartedPayload): Promise<void>;
  publishRoundStarted(payload: RoundStartedPayload): Promise<void>;
  publishRoundMultiplierTick(payload: RoundMultiplierTickPayload): Promise<void>;
  publishBetAccepted(payload: BetAcceptedPayload): Promise<void>;
  publishBetCashedOut(payload: BetCashedOutPayload): Promise<void>;
  publishRoundCrashed(payload: RoundCrashedPayload): Promise<void>;
  publishRoundSettled(payload: RoundSettledPayload): Promise<void>;
}
