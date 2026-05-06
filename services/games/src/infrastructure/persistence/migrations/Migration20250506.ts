import { Migration } from '@mikro-orm/migrations';

export class Migration20250506 extends Migration {

  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "rounds" (
        "id" VARCHAR(255) NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "current_multiplier" NUMERIC(10,4) NOT NULL,
        "crash_point" NUMERIC(10,4) NOT NULL,
        "hashed_seed" VARCHAR(64),
        "nonce" VARCHAR(64),
        "client_seed" VARCHAR(64),
        "server_seed_revealed" VARCHAR(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
      );
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "bets" (
        "id" VARCHAR(255) NOT NULL,
        "round_id" VARCHAR(255) REFERENCES "rounds" ("id") ON DELETE CASCADE,
        "player_id" VARCHAR(255) NOT NULL,
        "amount_cents" BIGINT NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "cashout_multiplier" NUMERIC(10,4),
        "payout_cents" BIGINT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
      );
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "outbox_events" (
        "id" VARCHAR(255) NOT NULL,
        "event_type" VARCHAR(50) NOT NULL,
        "aggregate_type" VARCHAR(50),
        "aggregate_id" VARCHAR(255),
        "payload" JSON NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "published_at" TIMESTAMP,
        "error_message" TEXT,
        "retry_count" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "outbox_events";');
    this.addSql('DROP TABLE IF EXISTS "bets";');
    this.addSql('DROP TABLE IF EXISTS "rounds";');
  }
}
