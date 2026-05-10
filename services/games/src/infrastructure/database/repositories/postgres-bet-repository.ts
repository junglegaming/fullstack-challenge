import { Bet } from "@/domain/entities/Bet";
import {
  BetProps,
  IBetRepository,
} from "@/domain/repositories/IBetRepository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PostgresBetRepository implements IBetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveBet(bet: Bet): Promise<void> {
    const data = bet.toJSON();

    await this.prisma.bet.upsert({
      where: { id: data.id },
      update: {
        status: data.status,
        cashoutMultiplier: data.multiplierAtCashout,
      },
      create: {
        id: data.id,
        userId: data.userId,
        amount: data.amount,
        roundId: (data as any).roundId,
        status: data.status,
        cashoutMultiplier: data.multiplierAtCashout,
      },
    });
  }

  async findBetsRoundId(id: string): Promise<Bet[]> {
    const betsData = await this.prisma.bet.findMany({
      where: { roundId: id },
    });

    return betsData.map((betData) =>
      new Bet({
        id: betData.id,
        userId: betData.userId,
        amount: betData.amount,
        roundId: betData.roundId,
        multiplierAtCashout: betData.cashoutMultiplier != null
            ? Number(betData.cashoutMultiplier)
            : null,
        status: betData.status as BetProps["status"],
      }),
    );
  }

  async findUserBetsId(userId: string): Promise<bigint> {
    const result = await this.prisma.bet.aggregate({
      _sum: { amount: true },
      where: { userId: userId },
    });

    return result._sum.amount || 0n;
  }
}