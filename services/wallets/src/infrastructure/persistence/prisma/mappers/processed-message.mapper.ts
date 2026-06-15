import { ProcessedMessage as PrismaProcessedMessage } from "@prisma/client";
import { ProcessedMessage } from "../../../../domain/entities/processed-message";

export class ProcessedMessageMapper {
  static toDomain(record: PrismaProcessedMessage): ProcessedMessage {
    return ProcessedMessage.reconstitute({
      id: record.id,
      idempotencyKey: record.idempotencyKey,
      messageType: record.messageType,
      walletTransactionId: record.ledgerTransactionId,
    });
  }

  static toPersistence(message: ProcessedMessage): {
    id: string;
    idempotencyKey: string;
    messageType: string;
    ledgerTransactionId: string;
  } {
    return {
      id: message.id,
      idempotencyKey: message.idempotencyKey,
      messageType: message.messageType,
      ledgerTransactionId: message.walletTransactionId,
    };
  }
}
