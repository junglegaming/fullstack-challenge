export interface Event {
  type: string;
  payload: Record<string, unknown>;
}

export interface IEventBus {
  publish(event: Event): Promise<void>;
}

export interface IEventConsumer {
  subscribe(eventType: string, handler: (payload: Record<string, unknown>) => Promise<void>): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}
