import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGameTables1748820000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "round_state_enum" AS ENUM ('BETTING', 'RUNNING', 'CRASHED')
    `);

    await queryRunner.query(`
      CREATE TYPE "bet_status_enum" AS ENUM ('PENDING', 'CASHED_OUT', 'LOST')
    `);

    await queryRunner.query(`
      CREATE TABLE "rounds" (
        "id"         UUID                   NOT NULL DEFAULT gen_random_uuid(),
        "state"      "round_state_enum"     NOT NULL DEFAULT 'BETTING',
        "seed"       VARCHAR                NOT NULL,
        "hash"       VARCHAR                NOT NULL,
        "crashPoint" FLOAT                  NOT NULL,
        "startedAt"  TIMESTAMP              NULL,
        "createdAt"  TIMESTAMP              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rounds" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bets" (
        "id"          UUID               NOT NULL DEFAULT gen_random_uuid(),
        "playerId"    VARCHAR            NOT NULL,
        "amountCents" BIGINT             NOT NULL,
        "status"      "bet_status_enum"  NOT NULL DEFAULT 'PENDING',
        "payoutCents" BIGINT             NULL,
        "roundId"     UUID               NOT NULL,
        CONSTRAINT "PK_bets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bets_round"
          FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_bets_round_player"
          UNIQUE ("roundId", "playerId")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bets"`);
    await queryRunner.query(`DROP TABLE "rounds"`);
    await queryRunner.query(`DROP TYPE "bet_status_enum"`);
    await queryRunner.query(`DROP TYPE "round_state_enum"`);
  }
}
