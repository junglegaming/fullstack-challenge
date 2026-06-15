import type { GameRoundEngineConfig } from "../../../application/config/game-round-engine.config";
import {
  DEFAULT_CLIENT_SEED,
  PROVABLY_FAIR_TEST_FIXTURE,
} from "../../../domain/constants/provably-fair";
import { Round } from "../../../domain/entities/round";
import { ProvablyFairService } from "../../../domain/services/provably-fair.service";
import { BetMapper } from "./mappers/bet.mapper";
import { RoundMapper } from "./mappers/round.mapper";
import { PrismaService } from "./prisma.service";

export async function seedGameRoundsIfEmpty(
  prisma: PrismaService,
  provablyFairService: ProvablyFairService,
  config: GameRoundEngineConfig,
): Promise<void> {
  const existingRounds = await prisma.round.count();

  if (existingRounds > 0) {
    return;
  }

  const historyRound = createSettledHistoryRound(provablyFairService);
  const currentRound = createCurrentRound(provablyFairService, config);

  await prisma.$transaction(async (tx) => {
    await tx.round.create({
      data: {
        ...RoundMapper.toPersistenceCreate(historyRound),
        bets: {
          create: historyRound.bets.map((bet) => BetMapper.toPersistence(bet)),
        },
      },
    });

    await tx.round.create({
      data: {
        ...RoundMapper.toPersistenceCreate(currentRound),
        bets: {
          create: currentRound.bets.map((bet) => BetMapper.toPersistence(bet)),
        },
      },
    });
  });
}

function createCurrentRound(
  provablyFairService: ProvablyFairService,
  config: GameRoundEngineConfig,
): Round {
  const now = new Date();

  return Round.createProvablyFair({
    provablyFairService,
    clientSeed: DEFAULT_CLIENT_SEED,
    nonce: 1,
    bettingStartedAt: now,
    bettingEndsAt: new Date(now.getTime() + config.bettingPhaseMs),
  });
}

function createSettledHistoryRound(
  provablyFairService: ProvablyFairService,
): Round {
  const round = Round.createProvablyFair({
    provablyFairService,
    clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
    nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
    bettingStartedAt: new Date("2026-06-14T12:00:00.000Z"),
    bettingEndsAt: new Date("2026-06-14T12:00:10.000Z"),
    serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
  });

  round.start(new Date("2026-06-14T12:00:11.000Z"));
  round.crash(new Date("2026-06-14T12:00:20.000Z"));
  round.settle(new Date("2026-06-14T12:00:21.000Z"));

  return round;
}
