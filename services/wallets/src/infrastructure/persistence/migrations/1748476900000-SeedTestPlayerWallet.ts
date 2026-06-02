import { MigrationInterface, QueryRunner } from "typeorm";

// Keycloak player UUID (realm: crash-game, user: player / player123)
const TEST_PLAYER_ID = "3c9b8f21-0c73-434d-b444-36f88e291186";
const INITIAL_BALANCE_CENTS = 1_000_000; // R$ 10.000,00

export class SeedTestPlayerWallet1748476900000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "wallets" ("playerId", "availableBalance")
       VALUES ($1, $2)
       ON CONFLICT ("playerId") DO NOTHING`,
      [TEST_PLAYER_ID, INITIAL_BALANCE_CENTS],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "wallets" WHERE "playerId" = $1`,
      [TEST_PLAYER_ID],
    );
  }
}
