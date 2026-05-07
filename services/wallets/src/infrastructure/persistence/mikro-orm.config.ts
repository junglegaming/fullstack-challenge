import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { WalletEntity } from './entities/orm/wallet.entity';
import { TransactionEntity } from './entities/orm/transaction.entity';
import { InboxEventEntity } from './entities/orm/inbox-event.orm-entity';
import { OutboxEventEntity } from './entities/orm/outbox-event.orm-entity';

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
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dbName: process.env.DB_NAME || 'wallet_service',
    };

export const mikroOrmConfig: Options = {
  driver: PostgreSqlDriver,
  ...dbConfig,
  entities: [WalletEntity, TransactionEntity, InboxEventEntity, OutboxEventEntity],
  migrations: {
    path: './src/infrastructure/persistence/migrations',
    pattern: '*.ts',
  },
  allowGlobalContext: true,
  debug: process.env.NODE_ENV !== 'production',
};

export default mikroOrmConfig;
