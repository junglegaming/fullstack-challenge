// services/games/src/infra/repositories/game.repository.ts
import { Injectable } from '@nestjs/common';
import { Round } from '../../domain/entities/round.entity';
import { Bet, PrismaClient } from '../../generated';

@Injectable()
export class GameRepository {
  constructor(private prisma: PrismaClient) {}

  async createRound(round: Round) {
    return this.prisma.round.create({
      data: {
        id: round.id,
        crashPoint: round.crashPoint,
        serverSeed: round.serverSeed,
        serverSeedHash: round.serverSeedHash,
        status: 'BETTING',
      },
    });
  }

  async updateRoundStatus(id: string, status: string) {
    return this.prisma.round.update({
      where: { id },
      data: { status },
    });
  }

 async createBet(bet: Bet) {
  return this.prisma.bet.create({
    data: {
      id: bet.id,
      playerId: bet.playerId,
      roundId: bet.roundId,
      amount: bet.amount,
      status: bet.status as any, 
      
      createdAt: new Date(), 
      payout: null,
      cashoutMultiplier: null,
    },
  });
}

  async findRoundById(id: string) {
  return this.prisma.round.findUnique({
    where: { id },
    include: { 
      bets: true 
    }
  });
}

async getRecentRounds(limit: number = 20) {
  return this.prisma.round.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      serverSeedHash: true,
      crashPoint: true,
      createdAt: true,
    },
  });
}

async updateBetToWon(playerId: string, roundId: string, payout: bigint, multiplier: number) {
  return this.prisma.bet.updateMany({
    where: {
      playerId,
      roundId, 
      status: 'PENDING',
    },
    data: {
      status: 'WON',
      payout: payout,
      cashoutMultiplier: multiplier,
    },
  });
}

async markPendingBetsAsLost(roundId: string) {
  return this.prisma.bet.updateMany({
    where: {
      roundId,
      status: 'PENDING',
    },
    data: {
      status: 'LOST',
      payout: 0n,
    },
  });
}

async updateUnresolvedBets(roundId: string) {
  return await this.prisma.bet.updateMany({
    where: {
      roundId: roundId,
      status: 'PENDING',
    },
    data: {
      status: 'LOST',
      payout: 0,
    },
  });
}

async deletePendingBet(playerId: string, roundId: string) {
  return this.prisma.bet.deleteMany({
    where: {
      playerId,
      roundId,
      status: 'PENDING', 
    },
  });
}
}