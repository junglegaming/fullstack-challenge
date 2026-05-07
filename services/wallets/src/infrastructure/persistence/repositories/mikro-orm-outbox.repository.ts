import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { OutboxEvent } from '../../../infrastructure/persistence/entities/outbox-event.entity';
import { IOutboxRepository } from '../../../application/ports/outbox-repository.port';
import { OutboxEventEntity } from '../entities/orm/outbox-event.orm-entity';

@Injectable()
export class MikroOrmOutboxRepository implements IOutboxRepository {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async save(event: OutboxEvent): Promise<void> {
    const entity = new OutboxEventEntity();
    entity.id = event.id;
    entity.eventType = event.eventType;
    entity.payload = event.payload;
    entity.status = event.status;
    entity.createdAt = event.createdAt;
    entity.publishedAt = event.publishedAt;
    entity.errorMessage = event.errorMessage;
    entity.retryCount = event.retryCount;
    await this.em.persistAndFlush(entity);
  }

  async update(event: OutboxEvent): Promise<void> {
    const entity = await this.em.findOne(OutboxEventEntity, { id: event.id });
    if (!entity) {
      throw new Error(`OutboxEvent ${event.id} not found`);
    }
    entity.status = event.status;
    entity.publishedAt = event.publishedAt;
    entity.errorMessage = entity.errorMessage;
    entity.retryCount = event.retryCount;
    await this.em.flush();
  }

  async findPending(maxRetries: number): Promise<OutboxEvent[]> {
    const entities = await this.em.find(OutboxEventEntity, {
      $or: [
        { status: 'PENDING' },
        { status: 'FAILED', retryCount: { $lt: maxRetries } },
      ],
    });
    return entities.map(e => this.mapToDomain(e));
  }

  async deletePublished(olderThan: Date): Promise<void> {
    await this.em.nativeDelete(OutboxEventEntity, {
      status: 'PUBLISHED',
      publishedAt: { $lt: olderThan },
    });
  }

  private mapToDomain(entity: OutboxEventEntity): OutboxEvent {
    const event = new OutboxEvent(
      entity.id,
      entity.eventType,
      entity.payload,
      entity.status as 'PENDING' | 'PUBLISHED' | 'FAILED',
      entity.createdAt,
      entity.publishedAt,
      entity.errorMessage,
      entity.retryCount,
    );
    return event;
  }
}
