import { Migration } from '@mikro-orm/migrations';

export class Migration20250505 extends Migration {

  override async up(): Promise<void> {
    // Create wallets table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id VARCHAR(255) NOT NULL UNIQUE,
        balance_cents BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_wallets_player_id ON wallets(player_id);`);

    // Create transactions table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id_str VARCHAR(255) NOT NULL,
        wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        amount_cents BIGINT NOT NULL,
        balance_after_cents BIGINT NOT NULL,
        reference_id VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id_str);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);`);

    // Create inbox_events table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS inbox_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        result JSONB
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_inbox_events_status ON inbox_events(status);`);

    // Create outbox_events table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS outbox_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        published_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON outbox_events(status);`);
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS outbox_events;');
    this.addSql('DROP TABLE IF EXISTS inbox_events;');
    this.addSql('DROP TABLE IF EXISTS transactions;');
    this.addSql('DROP TABLE IF EXISTS wallets;');
  }
}
