import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BettingControls } from "./BettingControls";
import { CrashChart } from "./CrashChart";
import { CurrentBetsList } from "./CurrentBetsList";
import { GameHeader } from "./GameHeader";
import { RoundHistory } from "./RoundHistory";
import {
  cashOut,
  createWallet,
  getCurrentRound,
  getMyBets,
  getRoundHistory,
  getWallet,
  placeBet,
} from "../services/api";
import { getAccessToken } from "../services/auth";
import { resolveMyActiveBet } from "../utils/active-bet";
import { pickLiveRound } from "../utils/live-round";
import { useGameSocket } from "../hooks/useGameSocket";
import { useGameStore } from "../stores/game-store";
import { useToastStore } from "../stores/toast-store";

export function GamePage() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);
  const hasAccessToken = Boolean(getAccessToken());
  const currentRound = useGameStore((state) => state.currentRound);
  const roundBets = useGameStore((state) => state.roundBets);
  const history = useGameStore((state) => state.history);
  const setCurrentRound = useGameStore((state) => state.setCurrentRound);
  const setServerTimeOffset = useGameStore((state) => state.setServerTimeOffset);
  const setHistory = useGameStore((state) => state.setHistory);

  useGameSocket();

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      try {
        return await getWallet();
      } catch {
        return createWallet();
      }
    },
    enabled: hasAccessToken,
  });

  const roundQuery = useQuery({
    queryKey: ["round", "current"],
    queryFn: getCurrentRound,
    refetchInterval: 5000,
  });

  const historyQuery = useQuery({
    queryKey: ["rounds", "history"],
    queryFn: getRoundHistory,
  });

  const myBetsQuery = useQuery({
    queryKey: ["bets", "me"],
    queryFn: getMyBets,
    enabled: hasAccessToken,
  });

  useEffect(() => {
    if (!roundQuery.data) {
      return;
    }

    const mergedRound = pickLiveRound(
      useGameStore.getState().currentRound,
      roundQuery.data,
    );

    if (!mergedRound) {
      return;
    }

    if (mergedRound.serverTime) {
      setServerTimeOffset(mergedRound.serverTime);
    }

    setCurrentRound(mergedRound);
  }, [roundQuery.data, setCurrentRound, setServerTimeOffset]);

  useEffect(() => {
    if (historyQuery.data) {
      setHistory(historyQuery.data.items);
    }
  }, [historyQuery.data, setHistory]);

  const placeBetMutation = useMutation({
    mutationFn: placeBet,
    onSuccess: async () => {
      pushToast({ type: "info", title: "Bet requested" });
      await queryClient.invalidateQueries({ queryKey: ["round", "current"] });
      await queryClient.invalidateQueries({ queryKey: ["bets", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error) =>
      pushToast({
        type: "error",
        title: "Bet failed",
        message: error instanceof Error ? error.message : undefined,
      }),
  });

  const cashOutMutation = useMutation({
    mutationFn: cashOut,
    onSuccess: async (result) => {
      pushToast({
        type: "success",
        title: "Cash out requested",
        message: `Estimated payout: ${formatCents(result.estimatedPayoutCents)}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["round", "current"] });
      await queryClient.invalidateQueries({ queryKey: ["bets", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error) =>
      pushToast({
        type: "error",
        title: "Cash out failed",
        message: error instanceof Error ? error.message : undefined,
      }),
  });

  const myActiveBet = resolveMyActiveBet(
    currentRound?.id,
    walletQuery.data?.playerId,
    myBetsQuery.data?.items,
    roundBets,
    currentRound?.bets ?? [],
  );
  const walletStatus = !hasAccessToken
    ? "unauthenticated"
    : walletQuery.isError
      ? "error"
      : walletQuery.isLoading
        ? "loading"
        : "ready";

  return (
    <main className="app-shell">
      <GameHeader
        wallet={walletQuery.data}
        walletErrorMessage={
          walletQuery.error instanceof Error ? walletQuery.error.message : undefined
        }
        walletStatus={walletStatus}
      />
      <div className="main-grid">
        <CrashChart round={currentRound} />
        <BettingControls
          cashingOut={cashOutMutation.isPending}
          myActiveBet={myActiveBet}
          onCashOut={() => cashOutMutation.mutate()}
          onPlaceBet={(amountCents) => placeBetMutation.mutate(amountCents)}
          placingBet={placeBetMutation.isPending}
          round={currentRound}
          wallet={walletQuery.data}
        />
      </div>
      <div className="bottom-grid">
        <CurrentBetsList bets={roundBets} />
        <RoundHistory rounds={history} />
      </div>
    </main>
  );
}

function formatCents(value: string): string {
  const cents = BigInt(value);
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");
  return `$ ${whole}.${fraction}`;
}
