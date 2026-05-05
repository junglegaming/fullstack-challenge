export interface Event {
  type: string;
  payload: Record<string, unknown>;
}

export interface IEventBus {
  publish(event: Event): Promise<void>;
}
