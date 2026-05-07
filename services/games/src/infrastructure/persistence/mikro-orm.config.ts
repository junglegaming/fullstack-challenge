import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { RoundEntity } from './entities/orm/round.entity';
import { BetEntity } from './entities/orm/bet.entity';
import { OutboxEventEntity } from './entities/orm/outbox-event.entity';

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432'),
    user: parsed.username,
    password: parsed.password,
    dbName: parsed.pathname.slice(1),
  };
}

const databaseUrl = process.env.DATABASE_URL;
const dbConfig = databaseUrl
  ? parseDatabaseUrl(databaseUrl)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      dbName: process.env.DB_NAME || 'games',
    };

export const mikroOrmConfig: Options = {
  driver: PostgreSqlDriver,
  ...dbConfig,
  entities: [RoundEntity, BetEntity, OutboxEventEntity],
  migrations: {
    path: './src/infrastructure/persistence/migrations',
    pattern: '*.ts',
  },
  allowGlobalContext: true,
  debug: process.env.NODE_ENV !== 'production',
};

export default mikroOrmConfig;
