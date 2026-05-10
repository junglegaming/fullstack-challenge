import { Bet } from "../entities/Bet";

export abstract class IBetRepository {
  abstract saveBet(bet: Bet): Promise<void>;
  abstract findBetsRoundId(id: string): Promise<Bet[]>;
  abstract findUserBetsId(userId: string): Promise<bigint>;
}

export interface BetProps {
  id: string;
  userId: string;
  roundId: string;
  amount: bigint;
  multiplierAtCashout: number | null;
  status: "PENDING" | "WON" | "LOST";
}
