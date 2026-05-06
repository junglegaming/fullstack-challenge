import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { RoundEntity } from './entities/orm/round.entity';
import { BetEntity } from './entities/orm/bet.entity';
import { OutboxEventEntity } from './entities/orm/outbox-event.entity';

export const mikroOrmConfig: Options = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  dbName: process.env.DB_NAME || 'games',
  entities: [RoundEntity, BetEntity, OutboxEventEntity],
  migrations: {
    path: './dist/infrastructure/persistence/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
};

export default mikroOrmConfig;
