import { randomUUID } from "node:crypto";

type ProcessedMessageProps = {
  id: string;
  idempotencyKey: string;
  messageType: string;
  walletTransactionId: string;
};

export class ProcessedMessage {
  private constructor(private readonly props: ProcessedMessageProps) {}

  static create(input: {
    idempotencyKey: string;
    messageType: string;
    walletTransactionId: string;
  }): ProcessedMessage {
    const idempotencyKey = input.idempotencyKey.trim();
    const messageType = input.messageType.trim();

    if (!idempotencyKey) {
      throw new Error("Idempotency key cannot be empty");
    }

    if (!messageType) {
      throw new Error("Message type cannot be empty");
    }

    return new ProcessedMessage({
      id: randomUUID(),
      idempotencyKey,
      messageType,
      walletTransactionId: input.walletTransactionId,
    });
  }

  static reconstitute(props: ProcessedMessageProps): ProcessedMessage {
    return new ProcessedMessage(props);
  }

  get id(): string {
    return this.props.id;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get messageType(): string {
    return this.props.messageType;
  }

  get walletTransactionId(): string {
    return this.props.walletTransactionId;
  }
}
