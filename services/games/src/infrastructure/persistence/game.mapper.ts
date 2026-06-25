import { Bet } from "../../domain/entities/bet.entity";
import { BetStatus } from "../../domain/entities/bet-status";
import { Round } from "../../domain/entities/round.aggregate";
import { RoundStatus } from "../../domain/entities/round-status";
import { Money } from "../../domain/value-objects/money.vo";
import { Multiplier } from "../../domain/value-objects/multiplier.vo";
import { BetOrmEntity } from "./bet.orm-entity";
import { RoundOrmEntity } from "./round.orm-entity";

export const GameMapper = {

  roundToOrm(round: Round): RoundOrmEntity {
    const row = new RoundOrmEntity();
    row.id = round.id;
    row.nonce = round.nonce;
    row.status = round.getStatus();
    row.serverSeed = round.serverSeed;
    row.serverSeedHash = round.serverSeedHash;
    row.crashPointHundredths = round.crashPoint.toHundredths();
    row.bettingEndsAt = round.getBettingEndsAt();
    row.startedAt = round.getStartedAt();
    row.crashedAt = round.getCrashedAt();
    return row;
  },

  betToOrm(bet: Bet): BetOrmEntity {
    const row = new BetOrmEntity();
    row.id = bet.id;
    row.roundId = bet.roundId;
    row.playerId = bet.playerId;
    row.username = bet.username;
    row.amountCents = bet.amount.toCents().toString();
    row.status = bet.getStatus();
    const multiplier = bet.getCashOutMultiplier();
    row.cashOutMultiplierHundredths = multiplier ? multiplier.toHundredths() : null;
    const payout = bet.getPayout();
    row.payoutCents = payout ? payout.toCents().toString() : null;
    row.settledAt = bet.getSettledAt();
    return row;
  },

  betToDomain(row: BetOrmEntity): Bet {
    return Bet.rehydrate({
      id: row.id,
      roundId: row.roundId,
      playerId: row.playerId,
      username: row.username,
      amount: Money.fromCents(row.amountCents),
      status: row.status as BetStatus,
      cashOutMultiplier:
        row.cashOutMultiplierHundredths !== null
          ? Multiplier.fromHundredths(row.cashOutMultiplierHundredths)
          : null,
      payout: row.payoutCents !== null ? Money.fromCents(row.payoutCents) : null,
      createdAt: row.createdAt,
      settledAt: row.settledAt,
    });
  },

  roundToDomain(row: RoundOrmEntity): Round {
    const bets = (row.bets ?? []).map((bet) => GameMapper.betToDomain(bet));
    return Round.rehydrate({
      id: row.id,
      nonce: row.nonce,
      status: row.status as RoundStatus,
      serverSeed: row.serverSeed,
      serverSeedHash: row.serverSeedHash,
      crashPoint: Multiplier.fromHundredths(row.crashPointHundredths),
      bets,
      createdAt: row.createdAt,
      bettingEndsAt: row.bettingEndsAt,
      startedAt: row.startedAt,
      crashedAt: row.crashedAt,
    });
  },
};
