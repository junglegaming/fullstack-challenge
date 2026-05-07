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
  // ⚠️ Importante: Use a desestruturação ou mapeamento manual aqui
  return this.prisma.bet.create({
    data: {
      id: bet.id,
      playerId: bet.playerId,
      roundId: bet.roundId,
      amount: bet.amount,
      status: bet.status as any, // Forçamos o cast para o Enum do Prisma aceitar
      
      // ✅ Preenchemos manualmente o que o Prisma exige e a Entidade não tem
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
      bets: true // Isso já traz as apostas da rodada se você precisar
    }
  });
}

async getRecentRounds(limit: number = 20) {
  return this.prisma.round.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    // Opcional: mostrar apenas as que já crasharam
    where: { status: 'CRASHED' } 
  });
}

async updateBetToWon(playerId: string, roundId: string, payout: bigint, multiplier: number) {
  return this.prisma.bet.updateMany({
    where: {
      playerId,
      roundId, // ✅ Usar o roundId evita que você atualize apostas de rodadas passadas por erro
      status: 'PENDING',
    },
    data: {
      status: 'WON',
      payout: payout,
      cashoutMultiplier: multiplier,
    },
  });
}

// 2. Para o Engine usar quando a rodada der CRASH
async markPendingBetsAsLost(roundId: string) {
  return this.prisma.bet.updateMany({
    where: {
      roundId,
      status: 'PENDING', // Quem não sacou a tempo, perdeu
    },
    data: {
      status: 'LOST',
      payout: 0n, // BigInt zero
    },
  });
}
}