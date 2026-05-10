import { WalletClient } from "@/infrastructure/messaging/wallet-client";
import { IBetRepository } from "../../domain/repositories/IBetRepository";
import type { BetCashoutUseCaseDTO } from "../dtos/bet.dto";
import { IRoundRepository } from "@/domain/repositories/IRoundRepository";

export class CashoutBetUseCase {
  constructor(
    private betRepository: IBetRepository,
    private roundRepository: IRoundRepository,
    private walletClient: WalletClient,
  ) {}

  async execute(dto: BetCashoutUseCaseDTO): Promise<string> {
    const round = await this.roundRepository.findActiveRound();

    if (!round) {
      throw new Error("Não há rodada ativa no momento");
    }

    const bets = await this.betRepository.findBetsRoundId(round.id);

    if (!bets || bets.length === 0) {
      throw new Error("Aposta não encontrada");
    }

    const bet = bets.find((b) => b.toJSON().userId === dto.userId);
    if (!bet) throw new Error("Sua aposta não foi encontrada nesta rodada");

    const currentMultiplier = round.getCurrentMultiplier();

    bet.cashout(currentMultiplier);

    const payout = currentMultiplier.calculatePayout(bet.toJSON().amount);

    await this.betRepository.saveBet(bet);
    await this.walletClient.emitBetWon(dto.userId, payout);
    return payout.toString();
  }
}