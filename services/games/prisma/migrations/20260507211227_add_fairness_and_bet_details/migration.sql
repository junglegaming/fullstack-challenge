/*
  Warnings:

  - Added the required column `serverSeed` to the `Round` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serverSeedHash` to the `Round` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bet" ADD COLUMN     "cashoutMultiplier" DOUBLE PRECISION,
ADD COLUMN     "payout" BIGINT;

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "serverSeed" TEXT NOT NULL,
ADD COLUMN     "serverSeedHash" TEXT NOT NULL;
