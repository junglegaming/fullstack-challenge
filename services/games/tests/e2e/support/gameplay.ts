import type { E2EApiClient } from "./api-client";
import type { CashOutResponse } from "./api-client";
import { ApiError } from "./http";
import { E2E_CONFIG } from "./config";
import { sleep, waitFor } from "./poll";

export async function waitForRoundStatus(
  client: E2EApiClient,
  status: string,
): Promise<string> {
  const round = await waitFor(`round status ${status}`, async () => {
    const current = await client.getCurrentRound();

    if (current.status === status) {
      return current;
    }

    return null;
  });

  return round.id;
}

export async function waitForBettingRound(client: E2EApiClient): Promise<string> {
  return waitForRoundStatus(client, "BETTING");
}

export async function waitForPlayerBetStatus(
  client: E2EApiClient,
  roundId: string,
  status: string,
): Promise<void> {
  const playerId = await client.resolvePlayerId();

  await waitFor(`player bet status ${status} in round ${roundId}`, async () => {
    const round = await client.getCurrentRound();

    if (round.id !== roundId) {
      return null;
    }

    const bet = client.findPlayerBetInRound(round, playerId);

    if (bet?.status === status) {
      return bet;
    }

    return null;
  });
}

export async function placeBetDuringBetting(
  client: E2EApiClient,
  amountCents: string,
): Promise<{ roundId: string }> {
  await waitForBettingRound(client);
  let round = await client.getCurrentRound();
  const bettingEndsAt = new Date(round.bettingEndsAt).getTime();

  if (Date.now() >= bettingEndsAt - 1_500) {
    const previousRoundId = round.id;
    await waitFor("next betting round", async () => {
      const nextRound = await client.getCurrentRound();

      if (nextRound.status === "BETTING" && nextRound.id !== previousRoundId) {
        return nextRound;
      }

      return null;
    });
  }

  const placed = await client.placeBet(amountCents);
  return { roundId: placed.roundId };
}

export async function placeBetAndWaitPlaced(
  client: E2EApiClient,
  amountCents: string,
): Promise<{ roundId: string; betId: string }> {
  const playerId = await client.resolvePlayerId();
  const { roundId } = await placeBetDuringBetting(client, amountCents);
  const bet = await waitFor(`bet PLACED in round ${roundId}`, async () => {
    const round = await client.getCurrentRound();
    const playerBet = client.findPlayerBetInRound(round, playerId);

    if (round.id === roundId && playerBet?.status === "PLACED") {
      return playerBet;
    }

    if (round.id === roundId && playerBet?.status === "REJECTED") {
      throw new Error(`Bet was rejected in round ${roundId}`);
    }

    return null;
  });

  return { roundId, betId: bet.id };
}

export async function waitForPlayerPayoutSettlementStatus(
  client: E2EApiClient,
  roundId: string,
  status: string,
): Promise<void> {
  const playerId = await client.resolvePlayerId();

  await waitFor(
    `player payout settlement status ${status} in round ${roundId}`,
    async () => {
      const round = await client.getCurrentRound();

      if (round.id !== roundId) {
        return null;
      }

      const bet = client.findPlayerBetInRound(round, playerId);

      if (bet?.payoutSettlementStatus === status) {
        return bet;
      }

      return null;
    },
  );
}

export async function waitForLatestPlayerPayoutSettlementStatus(
  client: E2EApiClient,
  status: string,
): Promise<void> {
  await waitFor(`player payout settlement status ${status}`, async () => {
    const bets = await client.getMyBets();
    const match = bets.items.find((bet) => bet.payoutSettlementStatus === status);

    if (match) {
      return match;
    }

    return null;
  });
}

export async function waitForWalletBalanceAtLeast(
  client: E2EApiClient,
  minimumBalanceCents: bigint,
): Promise<bigint> {
  const wallet = await waitFor(
    `wallet balance >= ${minimumBalanceCents.toString()}`,
    async () => {
      const current = await client.getWallet();
      const balance = BigInt(current.balanceCents);

      if (balance >= minimumBalanceCents) {
        return current;
      }

      return null;
    },
  );

  return BigInt(wallet.balanceCents);
}

export async function waitForWalletBalanceChange(
  client: E2EApiClient,
  previousBalanceCents: bigint,
  direction: "increase" | "decrease" | "unchanged",
): Promise<bigint> {
  return waitFor(`wallet balance ${direction}`, async () => {
    const balance = BigInt((await client.getWallet()).balanceCents);

    if (direction === "increase" && balance > previousBalanceCents) {
      return balance;
    }

    if (direction === "decrease" && balance < previousBalanceCents) {
      return balance;
    }

    if (direction === "unchanged" && balance === previousBalanceCents) {
      return balance;
    }

    return null;
  });
}

export async function waitForLatestPlayerBetStatus(
  client: E2EApiClient,
  status: string,
): Promise<void> {
  await waitFor(`player bet status ${status}`, async () => {
    const bets = await client.getMyBets();
    const match = bets.items.find((bet) => bet.status === status);

    if (match) {
      return match;
    }

    return null;
  });
}

export async function ensureStackIsReady(client: E2EApiClient): Promise<void> {
  await waitFor("games health", async () => {
    const response = await fetch(`${E2E_CONFIG.gamesBaseUrl}/health`);

    if (response.ok) {
      return true;
    }

    return null;
  }, { timeoutMs: 15_000 });

  await client.resolvePlayerId();
  await client.getCurrentRound();
}

export async function waitForBettingRoundWithoutPlayerBet(
  client: E2EApiClient,
): Promise<void> {
  const playerId = await client.resolvePlayerId();

  await waitFor("betting round without player bet", async () => {
    const round = await client.getCurrentRound();

    if (
      round.status === "BETTING" &&
      !client.findPlayerBetInRound(round, playerId)
    ) {
      return round;
    }

    return null;
  });
}

export async function prepareInsufficientBalanceAttempt(
  client: E2EApiClient,
): Promise<{ roundId: string; balanceBefore: bigint }> {
  await waitForBettingRoundWithoutPlayerBet(client);

  let balanceBefore = BigInt((await client.getWallet()).balanceCents);

  if (balanceBefore > 50_000n) {
    await placeBetAndWaitPlaced(client, "50000");
    await waitForBettingRoundWithoutPlayerBet(client);
    balanceBefore = BigInt((await client.getWallet()).balanceCents);
  }

  const { roundId } = await placeBetDuringBetting(
    client,
    (balanceBefore + 100n).toString(),
  );

  return { roundId, balanceBefore };
}

export async function cashOutDuringRunningRound(
  client: E2EApiClient,
  roundId: string,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<CashOutResponse> {
  return waitFor(`cash out during running round ${roundId}`, async () => {
    const round = await client.getCurrentRound();

    if (round.status !== "RUNNING" || round.id !== roundId) {
      return null;
    }

    try {
      return await client.cashOut();
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.body.code === "CASH_OUT_NOT_ALLOWED" ||
          error.body.code === "BET_NOT_FOUND")
      ) {
        return null;
      }

      throw error;
    }
  }, options);
}

export async function placeBetAndCashOut(
  client: E2EApiClient,
  betAmount: string,
  maxAttempts = 20,
): Promise<{ roundId: string; cashOut: CashOutResponse }> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const { roundId } = await placeBetAndWaitPlaced(client, betAmount);
      const cashOut = await cashOutDuringRunningRound(client, roundId, {
        timeoutMs: 10_000,
        intervalMs: 50,
      });

      await waitForPlayerBetStatus(client, roundId, "CASHED_OUT");

      return { roundId, cashOut };
    } catch {
      await waitForBettingRound(client);
    }
  }

  throw new Error(`Failed to cash out after ${maxAttempts.toString()} attempts`);
}

export async function waitAfterRoundStarts(): Promise<void> {
  await sleep(1_000);
}
