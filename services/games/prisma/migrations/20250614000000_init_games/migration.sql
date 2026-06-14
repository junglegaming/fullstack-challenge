-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('BETTING', 'RUNNING', 'CRASHED', 'SETTLED');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING_DEBIT', 'PLACED', 'REJECTED', 'CASHED_OUT', 'LOST');

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "status" "RoundStatus" NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "serverSeed" TEXT,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "crashPointBps" INTEGER NOT NULL,
    "bettingEndsAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "crashedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "status" "BetStatus" NOT NULL,
    "cashOutMultiplierBps" INTEGER,
    "payoutCents" BIGINT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rounds_status_idx" ON "rounds"("status");

-- CreateIndex
CREATE INDEX "rounds_createdAt_idx" ON "rounds"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bets_idempotencyKey_key" ON "bets"("idempotencyKey");

-- CreateIndex
CREATE INDEX "bets_playerId_idx" ON "bets"("playerId");

-- CreateIndex
CREATE INDEX "bets_roundId_idx" ON "bets"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "bets_roundId_playerId_key" ON "bets"("roundId", "playerId");

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
