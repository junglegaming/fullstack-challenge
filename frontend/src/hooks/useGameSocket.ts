import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { config } from "../config";
import {
  prependRoundHistoryCache,
  toHistoryItemFromCrashEvent,
} from "../queries/round-history";
import { isCurrentPlayer } from "../services/auth";
import type { MultiplierGrowthPayload } from "../services/api";
import { useGameStore } from "../stores/game-store";
import { useToastStore } from "../stores/toast-store";

type RoundBettingStarted = {
  roundId: string;
  serverSeedHash: string;
  bettingStartedAt: string;
  bettingEndsAt: string;
};

type RoundStarted = {
  roundId: string;
  startedAt: string;
  serverTime: string;
  serverSeedHash: string;
  baseMultiplier: string;
  multiplierGrowth: MultiplierGrowthPayload;
};

type MultiplierTick = {
  roundId: string;
  multiplier: string;
  occurredAt: string;
};

type BetAccepted = {
  roundId: string;
  betId: string;
  playerId: string;
  amountCents: string;
};

type BetCashedOut = {
  roundId: string;
  betId: string;
  playerId: string;
  cashOutMultiplier: string;
  payoutCents: string;
};

type RoundCrashed = {
  roundId: string;
  crashPoint: string;
  crashedAt: string;
  serverSeed: string;
  serverSeedHash: string;
};

export function useGameSocket(): void {
  const queryClient = useQueryClient();
  const setConnected = useGameStore((state) => state.setConnected);
  const setCurrentRound = useGameStore((state) => state.setCurrentRound);
  const applyMultiplierTick = useGameStore((state) => state.applyMultiplierTick);
  const resetMultiplierTicks = useGameStore((state) => state.resetMultiplierTicks);
  const upsertBet = useGameStore((state) => state.upsertBet);
  const pushToast = useToastStore((state) => state.pushToast);

  useEffect(() => {
    const socket = io(config.websocketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      pushToast({
        type: "error",
        title: "WebSocket disconnected",
        message: "Trying to reconnect to live game events.",
      });
    });

    socket.on("round.betting_started", (payload: RoundBettingStarted) => {
      resetMultiplierTicks();
      setCurrentRound({
        id: payload.roundId,
        status: "BETTING",
        serverSeedHash: payload.serverSeedHash,
        bettingStartedAt: payload.bettingStartedAt,
        bettingEndsAt: payload.bettingEndsAt,
        startedAt: null,
        crashedAt: null,
        currentMultiplier: "1.00",
        bets: [],
      });
      pushToast({ type: "info", title: "Betting phase started" });
    });

    socket.on("round.started", (payload: RoundStarted) => {
      const round = useGameStore.getState().currentRound;
      if (round && round.id !== payload.roundId) return;
      resetMultiplierTicks();
      setCurrentRound({
        ...(round ?? {
          id: payload.roundId,
          bettingStartedAt: payload.startedAt,
          bettingEndsAt: payload.startedAt,
          crashedAt: null,
          bets: [],
        }),
        status: "RUNNING",
        startedAt: payload.startedAt,
        serverSeedHash: payload.serverSeedHash,
        currentMultiplier: payload.baseMultiplier,
      });
      pushToast({ type: "info", title: "Round started" });
    });

    socket.on("round.multiplier_tick", (payload: MultiplierTick) => {
      const round = useGameStore.getState().currentRound;
      if (round?.id !== payload.roundId) return;
      applyMultiplierTick(payload.multiplier, payload.occurredAt);
    });

    socket.on("bet.accepted", (payload: BetAccepted) => {
      upsertBet({
        id: payload.betId,
        roundId: payload.roundId,
        playerId: payload.playerId,
        username: payload.playerId,
        amountCents: payload.amountCents,
        status: "PLACED",
        cashOutMultiplier: null,
        payoutCents: null,
      });

      if (isCurrentPlayer(payload.playerId)) {
        pushToast({ type: "success", title: "Bet accepted" });
      }
    });

    socket.on("bet.cashed_out", (payload: BetCashedOut) => {
      const bet = useGameStore
        .getState()
        .roundBets.find((item) => item.id === payload.betId);
      upsertBet({
        id: payload.betId,
        roundId: payload.roundId,
        playerId: payload.playerId,
        username: payload.playerId,
        amountCents: bet?.amountCents ?? "0",
        status: "CASHED_OUT",
        cashOutMultiplier: payload.cashOutMultiplier,
        payoutCents: payload.payoutCents,
      });

      if (isCurrentPlayer(payload.playerId)) {
        pushToast({ type: "success", title: "Cash out completed" });
      }
    });

    socket.on("round.crashed", (payload: RoundCrashed) => {
      const round = useGameStore.getState().currentRound;
      if (round?.id !== payload.roundId) return;
      resetMultiplierTicks();
      setCurrentRound({
        ...round,
        status: "CRASHED",
        crashedAt: payload.crashedAt,
        currentMultiplier: payload.crashPoint,
        serverSeedHash: payload.serverSeedHash,
        serverSeed: payload.serverSeed,
      });
      prependRoundHistoryCache(
        queryClient,
        toHistoryItemFromCrashEvent({
          ...payload,
          bettingStartedAt: round.bettingStartedAt,
        }),
      );
      pushToast({ type: "error", title: `Crashed at ${payload.crashPoint}x` });
    });

    socket.on("round.settled", () => {
      const round = useGameStore.getState().currentRound;
      if (!round) return;
      setCurrentRound({ ...round, status: "SETTLED" });
    });

    return () => {
      socket.disconnect();
    };
  }, [
    applyMultiplierTick,
    pushToast,
    queryClient,
    resetMultiplierTicks,
    setConnected,
    setCurrentRound,
    upsertBet,
  ]);
}
