"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useGameStore } from "@/stores/game-store";
import { useGameSocket } from "@/services/websocket";
import { CrashGraph } from "@/components/crash-graph";
import { BetsList } from "@/components/bets-list";
import { RoundHistory } from "@/components/round-history";
import { PlayerHeader } from "@/components/player-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, MyBetDisplay, getBetStatusLabel, getBetStatusColor } from "@/components/game-components";

import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// Lazy load heavy components
const CrashGraphLazy = dynamic(
  () => import("@/components/crash-graph").then((mod) => ({ default: mod.CrashGraph })),
  {
    ssr: false,
    loading: () => <CrashGraphSkeleton />,
  },
);

const BetsListLazy = dynamic(
  () => import("@/components/bets-list").then((mod) => ({ default: mod.BetsList })),
  { ssr: false, loading: () => <BetsListSkeleton /> },
);

const RoundHistoryLazy = dynamic(
  () => import("@/components/round-history").then((mod) => ({ default: mod.RoundHistory })),
  { ssr: false, loading: () => null },
);

function CrashGraphSkeleton() {
  return (
    <div className="h-64 flex items-center justify-center">
      <Skeleton className="h-32 w-32 rounded-full bg-[#1a1a2a]" />
    </div>
  );
}

function BetsListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full bg-[#1a1a2a]" />
      <Skeleton className="h-8 w-full bg-[#1a1a2a]" />
      <Skeleton className="h-8 w-full bg-[#1a1a2a]" />
    </div>
  );
}

// Extracted components to isolate re-renders
const BetAmountButton = React.memo(function BetAmountButton({
  value,
  onClick,
  disabled,
}: {
  value: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      key={value}
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="text-xs border-[#00ff88]/30 hover:bg-[#00ff88]/10 text-[#00ff88] hover:border-[#00ff88]/50 transition-all duration-300"
    >
      R$ {value}
    </Button>
  );
});

const BetControls = React.memo(function BetControls({
  betAmount,
  phase,
  userBet,
  balance,
  isPlacingBet,
  isCashingOut,
  onBetAmountChange,
  onPlaceBet,
  onCashOut,
}: {
  betAmount: string;
  phase: string;
  userBet: any;
  balance: number;
  isPlacingBet: boolean;
  isCashingOut: boolean;
  onBetAmountChange: (v: string) => void;
  onPlaceBet: () => void;
  onCashOut: () => void;
}) {
  const betAmountCents = useMemo(
    () => Math.round(parseFloat(betAmount) * 100) || 0,
    [betAmount],
  );

  const canBet = phase === "BETTING" && !userBet;
  const canCashOut = phase === "RUNNING" && userBet?.status === "PENDING";
  const hasSufficientBalance = betAmountCents <= balance;
  const isValidAmount = betAmountCents >= 100 && betAmountCents <= 100000;
  const canPlaceBet = canBet && hasSufficientBalance && isValidAmount;

  const multiplier = useGameStore((s) => s.multiplier);
  const potentialPayout = userBet
    ? (userBet.amountCents / 100) * multiplier
    : (betAmountCents / 100) * multiplier;

  const handleAmountClick = useCallback(
    (val: string) => () => onBetAmountChange(val),
    [onBetAmountChange],
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2 font-medium">
          Valor da Aposta (R$)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ff88] text-sm font-bold">
            R$
          </span>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => onBetAmountChange(e.target.value)}
            min="1.00"
            max="1000.00"
            step="0.01"
            className="bg-[#1a1a2a] border-[#00ff88]/30 pl-8 text-white placeholder:text-gray-600 focus:border-[#00ff88]/50 focus:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all duration-300"
            disabled={!canBet}
          />
        </div>
        {betAmountCents > balance && (
          <p className="text-xs text-[#ff0055] mt-1 flex items-center gap-1">
            <span>&#9888;</span> Saldo insuficiente ({formatCurrency(balance)})
          </p>
        )}
        {betAmountCents > 100000 && (
          <p className="text-xs text-[#ff0055] mt-1 flex items-center gap-1">
            <span>&#9888;</span> Valor máximo: R$ 1.000,00
          </p>
        )}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {["10", "50", "100", "500"].map((val) => (
            <BetAmountButton
              key={val}
              value={val}
              onClick={handleAmountClick(val)}
              disabled={!canBet}
            />
          ))}
        </div>
      </div>

      {(canBet || userBet?.status === "PENDING") && (
        <div className="text-center p-3 bg-[#1a1a2a] rounded-lg border border-[#00ff88]/10">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Ganho potencial</p>
          <p
            className="text-3xl font-black text-[#00ff88] tabular-nums"
            style={{ textShadow: "0 0 20px rgba(0,255,136,0.5)" }}
          >
            {formatCurrency(potentialPayout * 100)}
          </p>
          <p className="text-xs text-gray-500">
            @ {multiplier.toFixed(2)}x
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={onPlaceBet}
          disabled={!canPlaceBet || isPlacingBet}
          variant="neon-green"
          size="lg"
          className={`w-full font-black text-lg uppercase tracking-wider ${
            canPlaceBet && !isPlacingBet ? "" : "opacity-50 cursor-not-allowed"
          }`}
        >
          {isPlacingBet ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              APOSTANDO...
            </span>
          ) : !canBet ? (
            "AGUARDE..."
          ) : !isValidAmount ? (
            "VALOR INVÁLIDO"
          ) : !hasSufficientBalance ? (
            "SALDO INSUFICIENTE"
          ) : (
            "APOSTAR"
          )}
        </Button>

        <Button
          onClick={onCashOut}
          disabled={!canCashOut || isCashingOut}
          variant="neon-red"
          size="lg"
          className={`w-full font-black text-lg uppercase tracking-wider ${
            canCashOut && !isCashingOut
              ? "animate-pulse"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          {isCashingOut ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              CASH OUT...
            </span>
          ) : canCashOut ? (
            `CASH OUT @ ${useGameStore.getState().multiplier.toFixed(2)}x`
          ) : userBet?.status === "CASHED_OUT" ? (
            `CASH OUT @ ${userBet.cashoutMultiplier?.toFixed(2)}x`
          ) : (
            "CASH OUT"
          )}
        </Button>
      </div>

      <div className="pt-4 border-t border-[#ffffff]/10">
        <p className="text-sm text-gray-400 mb-2 font-medium">Minha Aposta</p>
        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
          <MyBetDisplay userBet={userBet} />
        </div>
      </div>
    </div>
  );
});

export default function GamePage() {
  const router = useRouter();
  const [betAmount, setBetAmount] = useState("10.00");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const { isAuthenticated, isLoading: authLoading, getToken } = useAuth();

  // Individual selectors to avoid re-renders
  const multiplier = useGameStore((s) => s.multiplier);
  const phase = useGameStore((s) => s.phase);
  const balance = useGameStore((s) => s.balance);
  const bets = useGameStore((s) => s.bets);
  const userBet = useGameStore((s) => s.userBet);

  const { connect, disconnect } = useGameSocket();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const t = getToken();
    if (t) {
      api.setToken(t);
      connect();
    }
    return () => {
      disconnect();
    };
  }, [getToken, connect, disconnect]);

  const handlePlaceBet = useCallback(async () => {
    const amountCents = Math.round(parseFloat(betAmount) * 100);
    if (isNaN(amountCents) || amountCents < 100) return;

    if (amountCents > balance) {
      toast.error("Saldo insuficiente", {
        description: `Seu saldo é ${formatCurrency(balance)}`,
      });
      return;
    }

    setIsPlacingBet(true);
    try {
      await api.post("/games/bet", { amountCents });
      toast.success("Aposta realizada!", {
        description: `R$ ${(amountCents / 100).toFixed(2)} no multiplicador ${multiplier.toFixed(2)}x`,
      });
    } catch (e: any) {
      toast.error("Erro ao apostar", {
        description: e.message || "Tente novamente",
      });
    } finally {
      setIsPlacingBet(false);
    }
  }, [betAmount, balance, multiplier]);

  const handleCashOut = useCallback(async () => {
    setIsCashingOut(true);
    try {
      await api.post("/games/bet/cashout");
      toast.success("Cash Out realizado!", {
        description: `Multiplicador ${multiplier.toFixed(2)}x`,
      });
    } catch (e: any) {
      toast.error("Erro no Cash Out", {
        description: e.message || "Tente novamente",
      });
    } finally {
      setIsCashingOut(false);
    }
  }, [multiplier]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] text-white p-4 flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48 bg-[#1a1a2a]" />
          <Skeleton className="h-64 w-full max-w-3xl bg-[#1a1a2a]" />
          <Skeleton className="h-32 w-full max-w-3xl bg-[#1a1a2a]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white p-4">
      <div className="max-w-7xl mx-auto">
        <PlayerHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-[#00ff88]/20 bg-[#0f0f23] shadow-[0_0_30px_rgba(0,255,136,0.1)]">
              <CardContent className="pt-6">
                {phase === "BETTING" && !userBet ? (
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-32 w-32 rounded-full bg-[#1a1a2a]" />
                  </div>
                ) : (
                  <CrashGraphLazy />
                )}
                <div className="mt-4 text-center">
                  <StatusBadge phase={phase} />
                </div>
              </CardContent>
            </Card>

            {/* Players' Bets - Social Proof */}
            <Card className="border-[#ffffff]/5 bg-[#0f0f23]">
              <CardHeader>
                <CardTitle className="text-lg text-[#00ff88] font-bold">Apostas da Rodada</CardTitle>
              </CardHeader>
              <CardContent>
                {bets.length === 0 ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full bg-[#1a1a2a]" />
                    <Skeleton className="h-8 w-full bg-[#1a1a2a]" />
                    <Skeleton className="h-8 w-full bg-[#1a1a2a]" />
                  </div>
                ) : (
                  <BetsListLazy bets={bets} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bet Controls */}
          <div className="space-y-4">
            <Card className="border-[#00ff88]/20 bg-[#0f0f23] shadow-[0_0_20px_rgba(0,255,136,0.05)]">
              <CardHeader>
                <CardTitle className="text-[#00ff88] font-bold uppercase tracking-wider text-lg">Fazer Aposta</CardTitle>
              </CardHeader>
              <CardContent>
                <BetControls
                  betAmount={betAmount}
                  phase={phase}
                  userBet={userBet}
                  balance={balance}
                  isPlacingBet={isPlacingBet}
                  isCashingOut={isCashingOut}
                  onBetAmountChange={setBetAmount}
                  onPlaceBet={handlePlaceBet}
                  onCashOut={handleCashOut}
                />
              </CardContent>
            </Card>

            {/* Crash History */}
            <Card className="border-[#ffffff]/5 bg-[#0f0f23]">
              <CardHeader>
                <CardTitle className="text-lg text-[#bf00ff] font-bold">Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <RoundHistoryLazy />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
