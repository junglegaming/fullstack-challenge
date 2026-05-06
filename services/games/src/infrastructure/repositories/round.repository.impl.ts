import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Round } from '@/domain/entities/round.entity';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { RoundRepository } from '@/domain/repositories/round.repository';
import { RoundEntity } from '../persistence/entities/orm/round.entity';
import { BetEntity } from '../persistence/entities/orm/bet.entity';
import { OutboxEventEntity } from '../persistence/entities/orm/outbox-event.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { RoundSeed } from '@/domain/value-objects/round-seed.vo';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { Bet } from '@/domain/entities/bet.entity';
import { BetId } from '@/domain/value-objects/bet-id.vo';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { BetStatus } from '@/domain/enums/bet-status.enum';
import { OutboxEventId } from '@/domain/value-objects/outbox-event-id.vo';

@Injectable()
export class RoundRepositoryImpl implements RoundRepository {
  constructor(private readonly orm: MikroORM) {}

  async getCurrent(): Promise<Round> {
    const em = this.orm.em.fork();
    const roundEntity = await em.findOne(
      RoundEntity,
      {},
      { orderBy: { createdAt: 'DESC' } },
    );

    if (!roundEntity) {
      throw new Error('No active round found');
    }

    return this.mapToDomain(roundEntity);
  }

  async save(round: Round, events: OutboxEvent[] = []): Promise<void> {
    const em = this.orm.em.fork();

    await em.transactional(async (em) => {
      let roundEntity = await em.findOne(RoundEntity, { id: round.roundId.raw });

      if (!roundEntity) {
        roundEntity = new RoundEntity();
        roundEntity.id = round.roundId.raw;
        em.persist(roundEntity);
      }

      roundEntity.status = round.roundStatus;
      roundEntity.currentMultiplier = round.multiplier.raw.toString();
      roundEntity.crashPoint = round.roundCrashPoint.raw.toString();

      const currentSeed = (round as any).seed;
      if (currentSeed) {
        if (!roundEntity.hashedSeed) {
          roundEntity.hashedSeed = currentSeed.hashedSeed;
          roundEntity.nonce = currentSeed.nonce;
          roundEntity.clientSeed = currentSeed.clientSeed;
        }
        if (currentSeed.isRevealed && !roundEntity.serverSeedRevealed) {
          roundEntity.serverSeedRevealed = currentSeed.reveal();
        }
      }

      for (const domainBet of round.roundBets) {
        let betEntity = await em.findOne(BetEntity, { id: domainBet.betId.raw });
        if (!betEntity) {
          betEntity = new BetEntity();
          betEntity.id = domainBet.betId.raw;
          betEntity.round = roundEntity;
          betEntity.playerId = domainBet.player.raw;
          betEntity.amountCents = domainBet.betAmount.amount;
          em.persist(betEntity);
        }
        betEntity.status = domainBet.betStatus;
        betEntity.cashoutMultiplier = domainBet.cashoutMultiplierValue?.raw?.toString() || null;
        if (domainBet.betStatus === 'CASHED_OUT') {
          betEntity.payoutCents = domainBet.payout.amount;
        }
      }

      for (const event of events) {
        const outboxEntity = new OutboxEventEntity();
        outboxEntity.id = event.eventId.raw();
        outboxEntity.aggregateType = event.aggregateType;
        outboxEntity.aggregateId = event.aggregateId;
        outboxEntity.eventType = event.eventType;
        outboxEntity.payload = event.eventPayload;
        em.persist(outboxEntity);
      }

      await em.flush();
    });
  }

  async findPendingOutboxEvents(limit: number): Promise<OutboxEvent[]> {
    const em = this.orm.em.fork();
    const entities = await em.find(
      OutboxEventEntity,
      { publishedAt: null },
      { orderBy: { createdAt: 'ASC' }, limit },
    );

    return entities.map((e) => new OutboxEvent(
      new OutboxEventId(e.id),
      e.aggregateType,
      e.aggregateId,
      e.eventType,
      e.payload,
      e.createdAt,
    ));
  }

  async markOutboxEventAsPublished(eventId: string): Promise<void> {
    const em = this.orm.em.fork();
    const entity = await em.findOne(OutboxEventEntity, { id: eventId });
    if (entity) {
      entity.publishedAt = new Date();
      await em.flush();
    }
  }

  async incrementOutboxEventFailedAttempts(eventId: string): Promise<void> {
    const em = this.orm.em.fork();
    await em.createQueryBuilder(OutboxEventEntity).update({ failedAttempts: (qb) => `${qb.raw('failed_attempts')} + 1` }).where({ id: eventId }).execute();
  }

  private async mapToDomain(roundEntity: RoundEntity): Promise<Round> {
    const seed = new RoundSeed(
      roundEntity.hashedSeed,
      roundEntity.nonce,
      roundEntity.clientSeed,
      roundEntity.serverSeedRevealed,
    );

    const round = new Round(
      new RoundId(roundEntity.id),
      roundEntity.status as any,
      seed,
    );

    const em = this.orm.em.fork();
    const betEntities = await em.find(BetEntity, { round: roundEntity.id });

    for (const betEntity of betEntities) {
      const bet = new Bet(
        new BetId(betEntity.id),
        new PlayerId(betEntity.playerId),
        new Money(betEntity.amountCents),
      );
      if (betEntity.status === 'CASHED_OUT' && betEntity.cashoutMultiplier) {
        bet.cashOut(new Multiplier(parseFloat(betEntity.cashoutMultiplier)));
      } else if (betEntity.status === 'LOST') {
        bet.lose();
      }
    }

    return round;
  }
}
