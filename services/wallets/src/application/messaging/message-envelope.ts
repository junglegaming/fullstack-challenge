import { randomUUID } from "node:crypto";

export type MessageEnvelope<T> = {
  messageId: string;
  type: string;
  version: number;
  correlationId: string;
  causationId?: string | null;
  idempotencyKey: string;
  occurredAt: string;
  producer: string;
  payload: T;
};

export function createMessageEnvelope<T>(input: {
  type: string;
  producer: string;
  payload: T;
  idempotencyKey: string;
  correlationId: string;
  causationId?: string | null;
}): MessageEnvelope<T> {
  return {
    messageId: randomUUID(),
    type: input.type,
    version: 1,
    correlationId: input.correlationId,
    causationId: input.causationId ?? null,
    idempotencyKey: input.idempotencyKey,
    occurredAt: new Date().toISOString(),
    producer: input.producer,
    payload: input.payload,
  };
}
