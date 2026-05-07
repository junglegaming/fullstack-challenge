import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InboxEvent } from '../../../infrastructure/persistence/entities/inbox-event.entity';
import { IInboxRepository } from '../../../application/ports/inbox-repository.port';
import { InboxEventEntity } from '../entities/orm/inbox-event.orm-entity';

@Injectable()
export class MikroOrmInboxRepository implements IInboxRepository {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async findById(id: string): Promise<InboxEvent | null> {
    const entity = await this.em.findOne(InboxEventEntity, { id });
    if (!entity) return null;
    return this.mapToDomain(entity);
  }

  async save(event: InboxEvent): Promise<void> {
    const entity = new InboxEventEntity();
    entity.id = event.id;
    entity.eventType = event.eventType;
    entity.payload = event.payload;
    entity.status = event.status;
    entity.createdAt = event.createdAt;
    entity.processedAt = event.processedAt;
    entity.errorMessage = event.errorMessage;
    entity.retryCount = event.retryCount;
    if (event.result) {
      entity.result = {
        transactionId: event.result.transactionId,
        newBalanceCents: event.result.newBalanceCents.toString(),
      };
    }
    await this.em.persistAndFlush(entity);
  }

  async update(event: InboxEvent): Promise<void> {
    const entity = await this.em.findOne(InboxEventEntity, { id: event.id });
    if (!entity) {
      throw new Error(`InboxEvent ${event.id} not found`);
    }
    entity.status = event.status;
    entity.processedAt = event.processedAt;
    entity.errorMessage = event.errorMessage;
    entity.retryCount = event.retryCount;
    if (event.result) {
      entity.result = {
        transactionId: event.result.transactionId,
        newBalanceCents: event.result.newBalanceCents.toString(),
      };
    }
    await this.em.flush();
  }

  async findPending(maxRetries: number): Promise<InboxEvent[]> {
    const entities = await this.em.find(InboxEventEntity, {
      $or: [
        { status: 'PENDING' },
        { status: 'FAILED', retryCount: { $lt: maxRetries } },
      ],
    });
    return entities.map(e => this.mapToDomain(e));
  }

  private mapToDomain(entity: InboxEventEntity): InboxEvent {
    const event = new InboxEvent(
      entity.id,
      entity.eventType,
      entity.payload as Record<string, unknown>,
      entity.status as 'PENDING' | 'PROCESSED' | 'FAILED',
      entity.createdAt,
      entity.processedAt,
      entity.errorMessage,
      entity.retryCount,
    );
    if (entity.result) {
      (event as any).result = {
        transactionId: entity.result.transactionId,
        newBalanceCents: BigInt(entity.result.newBalanceCents),
      };
    }
    return event;
  }
}
