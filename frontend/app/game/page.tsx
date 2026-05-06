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
    if (phase === "RUNNING") return "bg-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.6)]";
    if (phase === "CRASHED") return "bg-[#ff0055] shadow-[0_0_15px_rgba(255,0,85,0.6)]";
    return "bg-gray-600";
  };

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
                  <CrashGraph />
                )}
                <div className="mt-4 text-center">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${getStatusColor()}`}>
                    {getStatusLabel()}
                  </span>
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
                  <BetsList bets={bets} />
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
              <CardContent className="space-y-4">
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
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="1.00"
                      max="1000.00"
                      step="0.01"
                      className="bg-[#1a1a2a] border-[#00ff88]/30 pl-8 text-white placeholder:text-gray-600 focus:border-[#00ff88]/50 focus:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all duration-300"
                      disabled={!canBet}
                    />
                  </div>
                  {betAmountCents > balance && (
                    <p className="text-xs text-[#ff0055] mt-1 flex items-center gap-1">
                      <span>⚠</span> Saldo insuficiente ({formatCurrency(balance)})
                    </p>
                  )}
                  {betAmountCents > 100000 && (
                    <p className="text-xs text-[#ff0055] mt-1 flex items-center gap-1">
                      <span>⚠</span> Valor máximo: R$ 1.000,00
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
                        className="text-xs border-[#00ff88]/30 hover:bg-[#00ff88]/10 text-[#00ff88] hover:border-[#00ff88]/50 transition-all duration-300"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Potencial ganho */}
                {(canBet || userBet?.status === "PENDING") && (
                  <div className="text-center p-3 bg-[#1a1a2a] rounded-lg border border-[#00ff88]/10">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Ganho potencial</p>
                    <p className="text-3xl font-black text-[#00ff88] tabular-nums" style={{ textShadow: "0 0 20px rgba(0,255,136,0.5)" }}>
                      {formatCurrency(potentialPayout * 100)}
                    </p>
                    <p className="text-xs text-gray-500">
                      @ {multiplier.toFixed(2)}x
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handlePlaceBet}
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
                    onClick={handleCashOut}
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
                      `CASH OUT @ ${multiplier.toFixed(2)}x`
                    ) : userBet?.status === "CASHED_OUT" ? (
                      `CASH OUT @ ${userBet.cashoutMultiplier?.toFixed(2)}x`
                    ) : (
                      "CASH OUT"
                    )}
                  </Button>
                </div>

                <div className="pt-4 border-t border-[#ffffff]/10">
                  <p className="text-sm text-gray-400 mb-2 font-medium">Minha Aposta</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {userBet ? (
                      <div className="flex justify-between text-sm p-2 bg-[#1a1a2a] rounded">
                        <span className="text-white font-medium">{formatCurrency(userBet.amountCents)}</span>
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
            <Card className="border-[#ffffff]/5 bg-[#0f0f23]">
              <CardHeader>
                <CardTitle className="text-lg text-[#bf00ff] font-bold">Histórico</CardTitle>
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
  if (betStatus === "CASHED_OUT") return "text-[#00ff88] font-bold";
  if (betStatus === "LOST") return "text-[#ff0055] font-bold";
  return "text-yellow-400";
}
