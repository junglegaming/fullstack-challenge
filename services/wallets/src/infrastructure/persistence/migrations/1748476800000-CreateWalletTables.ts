import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletTables1748476800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
        "playerId"         VARCHAR      NOT NULL,
        "availableBalance" BIGINT       NOT NULL DEFAULT 0,
        CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallets_playerId" UNIQUE ("playerId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallet_reservations" (
        "id"            UUID    NOT NULL DEFAULT gen_random_uuid(),
        "reservationId" VARCHAR NOT NULL,
        "amount"        BIGINT  NOT NULL,
        "walletId"      UUID    NOT NULL,
        CONSTRAINT "PK_wallet_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallet_reservations_wallet"
          FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_wallet_reservations_wallet_reservation"
          UNIQUE ("walletId", "reservationId")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wallet_reservations"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
  }
}
