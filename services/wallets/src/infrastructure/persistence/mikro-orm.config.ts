import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { WalletEntity } from './entities/orm/wallet.entity';
import { TransactionEntity } from './entities/orm/transaction.entity';
import { InboxEventEntity } from './entities/orm/inbox-event.orm-entity';
import { OutboxEventEntity } from './entities/orm/outbox-event.orm-entity';

export const mikroOrmConfig: Options = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'wallet_service',
  entities: [WalletEntity, TransactionEntity, InboxEventEntity, OutboxEventEntity],
  migrations: {
    path: './dist/infrastructure/persistence/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
};

export default mikroOrmConfig;
