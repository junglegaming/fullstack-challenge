-- CreateTable
CREATE TABLE "processed_messages" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "ledgerTransactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processed_messages_idempotencyKey_key" ON "processed_messages"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "processed_messages_ledgerTransactionId_key" ON "processed_messages"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "processed_messages_messageType_idx" ON "processed_messages"("messageType");

-- AddForeignKey
ALTER TABLE "processed_messages" ADD CONSTRAINT "processed_messages_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "ledger_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
