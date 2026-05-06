"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function GamePage() {
  const router = useRouter();
  const [betAmount, setBetAmount] = useState("10.00");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const { isAuthenticated, isLoading: authLoading, getToken } = useAuth();

  const {
    multiplier,
    phase,
    balance,
    bets,
    userBet,
    setBalance,
  } = useGameStore();

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

  const handlePlaceBet = async () => {
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
  };

  const handleCashOut = async () => {
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
  };

  const canBet = phase === "BETTING" && !userBet;
  const canCashOut = phase === "RUNNING" && userBet?.status === "PENDING";

  const betAmountCents = Math.round(parseFloat(betAmount) * 100) || 0;
  const hasSufficientBalance = betAmountCents <= balance;
  const isValidAmount = betAmountCents >= 100 && betAmountCents <= 100000;
  const canPlaceBet = canBet && hasSufficientBalance && isValidAmount;

  const potentialPayout = userBet
    ? (userBet.amountCents / 100) * multiplier
    : (betAmountCents / 100) * multiplier;

  const getStatusLabel = () => {
    if (phase === "BETTING") return "Fase de Apostas";
    if (phase === "RUNNING") return "Rodada em Andamento";
    if (phase === "CRASHED") return "Crashou!";
    return phase;
  };

  const getStatusColor = () => {
    if (phase === "BETTING") return "bg-blue-600";
    if (phase === "RUNNING") return "bg-green-600 animate-pulse";
    if (phase === "CRASHED") return "bg-red-600";
    return "bg-gray-600";
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full max-w-3xl" />
          <Skeleton className="h-32 w-full max-w-3xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <PlayerHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6">
                {phase === "BETTING" && !userBet ? (
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                  </div>
                ) : (
                  <CrashGraph />
                )}
                <div className="mt-4 text-center">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm ${getStatusColor()}`}>
                    {getStatusLabel()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Players' Bets - Social Proof */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Apostas da Rodada</CardTitle>
              </CardHeader>
              <CardContent>
                {bets.length === 0 ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <BetsList bets={bets} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bet Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fazer Aposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Valor da Aposta (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      R$
                    </span>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="1.00"
                      max="1000.00"
                      step="0.01"
                      className="bg-gray-800 border-gray-700 pl-8 text-white"
                      disabled={!canBet}
                    />
                  </div>
                  {betAmountCents > balance && (
                    <p className="text-xs text-red-400 mt-1">
                      Saldo insuficiente ({formatCurrency(balance)})
                    </p>
                  )}
                  {betAmountCents > 100000 && (
                    <p className="text-xs text-red-400 mt-1">
                      Valor máximo: R$ 1.000,00
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { label: "R$ 10", value: "10" },
                      { label: "R$ 50", value: "50" },
                      { label: "R$ 100", value: "100" },
                      { label: "R$ 500", value: "500" },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setBetAmount(opt.value)}
                        disabled={!canBet}
                        className="text-xs border-gray-700 hover:bg-gray-700 text-gray-300"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Potencial ganho */}
                {(canBet || userBet?.status === "PENDING") && (
                  <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400">Ganho potencial</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(potentialPayout * 100)}
                    </p>
                    <p className="text-xs text-gray-500">
                      @ {multiplier.toFixed(2)}x
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handlePlaceBet}
                    disabled={!canPlaceBet || isPlacingBet}
                    className={`w-full font-bold text-lg ${
                      canPlaceBet && !isPlacingBet
                        ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {isPlacingBet ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Apostando...
                      </span>
                    ) : !canBet ? (
                      "Aguarde..."
                    ) : !isValidAmount ? (
                      "Valor inválido"
                    ) : !hasSufficientBalance ? (
                      "Saldo insuficiente"
                    ) : (
                      "Apostar"
                    )}
                  </Button>

                  <Button
                    onClick={handleCashOut}
                    disabled={!canCashOut || isCashingOut}
                    className={`w-full font-bold text-lg ${
                      canCashOut && !isCashingOut
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 animate-pulse"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {isCashingOut ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Cash Out...
                      </span>
                    ) : canCashOut ? (
                      `Cash Out @ ${multiplier.toFixed(2)}x`
                    ) : userBet?.status === "CASHED_OUT" ? (
                      `Cash Out @ ${userBet.cashoutMultiplier?.toFixed(2)}x`
                    ) : (
                      "Cash Out"
                    )}
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Minha Aposta</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {userBet ? (
                      <div className="flex justify-between text-sm">
                        <span>{formatCurrency(userBet.amountCents)}</span>
                        <span className={getBetStatusColor(userBet.status)}>
                          {getBetStatusLabel(userBet.status)}
                          {userBet.cashoutMultiplier &&
                            ` @ ${userBet.cashoutMultiplier.toFixed(2)}x`}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma aposta ativa</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crash History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <RoundHistory />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function getBetStatusLabel(betStatus: string) {
  if (betStatus === "CASHED_OUT") return "Ganhou";
  if (betStatus === "LOST") return "Perdeu";
  return "Ativo";
}

function getBetStatusColor(betStatus: string) {
  if (betStatus === "CASHED_OUT") return "text-green-400";
  if (betStatus === "LOST") return "text-red-400";
  return "text-yellow-400";
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
