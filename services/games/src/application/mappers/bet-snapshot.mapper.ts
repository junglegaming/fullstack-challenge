import type { Bet } from "../../domain/entities/bet.entity";
import type { BetSnapshot } from "../events/game-events";

export function toBetSnapshot(bet: Bet): BetSnapshot {

  const multiplier = bet.getCashOutMultiplier();
  const payout = bet.getPayout();
  return {
    betId: bet.id,
    roundId: bet.roundId,
    username: bet.username,

    amountCents: bet.amount.toCents().toString(),
    status: bet.getStatus(),
    cashOutMultiplier: multiplier ? multiplier.toNumber() : null,
    payoutCents: payout ? payout.toCents().toString() : null,
  };
}
