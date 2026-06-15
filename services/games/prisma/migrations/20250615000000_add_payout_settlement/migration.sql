-- CreateEnum
CREATE TYPE "PayoutSettlementStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED');

-- AlterTable
ALTER TABLE "bets" ADD COLUMN "payoutSettlementStatus" "PayoutSettlementStatus",
ADD COLUMN "payoutCreditIdempotencyKey" TEXT,
ADD COLUMN "payoutSettlementFailureReason" TEXT;

-- CreateIndex
CREATE INDEX "bets_payoutCreditIdempotencyKey_idx" ON "bets"("payoutCreditIdempotencyKey");
