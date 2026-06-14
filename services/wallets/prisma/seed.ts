import { PrismaClient, LedgerTransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_PLAYER_ID =
  process.env.TEST_PLAYER_ID ?? "00000000-0000-4000-8000-000000000001";
const INITIAL_BALANCE_CENTS = BigInt(
  process.env.WALLET_INITIAL_BALANCE_CENTS ?? "100000",
);

async function main(): Promise<void> {
  const existingWallet = await prisma.wallet.findUnique({
    where: { playerId: TEST_PLAYER_ID },
  });

  if (existingWallet) {
    console.log(`Test player wallet already exists (${TEST_PLAYER_ID})`);
    return;
  }

  const wallet = await prisma.wallet.create({
    data: {
      playerId: TEST_PLAYER_ID,
      balanceCents: INITIAL_BALANCE_CENTS,
    },
  });

  if (INITIAL_BALANCE_CENTS > 0n) {
    await prisma.ledgerTransaction.create({
      data: {
        walletId: wallet.id,
        idempotencyKey: `wallet-init-${wallet.id}`,
        type: LedgerTransactionType.CREDIT,
        amountCents: INITIAL_BALANCE_CENTS,
        balanceAfterCents: INITIAL_BALANCE_CENTS,
      },
    });
  }

  console.log(
    `Seeded test player wallet with balance ${INITIAL_BALANCE_CENTS.toString()} cents`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
