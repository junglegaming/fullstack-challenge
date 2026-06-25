import { GameEvent } from "../events/game-events";

export const GAME_EVENTS_PUBLISHER = Symbol("GAME_EVENTS_PUBLISHER");

export interface GameEventsPublisher {
  publish(event: GameEvent): void;
}
