"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { useRouter } from "next/navigation";
import { useGameSocket } from "@/services/websocket";
import { CrashGraph } from "@/components/crash-graph";
import { BetsList } from "@/components/bets-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function GamePage() {
  const router = useRouter();
  const [betAmount, setBetAmount] = useState("10.00");
  const [token, setToken] = useState<string | null>(null);

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
    const t = localStorage.getItem("kc_token");
    if (!t) {
      router.push("/");
      return;
    }
    setToken(t);
    api.setToken(t);

    connect();

    return () => {
      disconnect();
    };
  }, [router, connect, disconnect]);

  const handlePlaceBet = async () => {
    const amountCents = Math.round(parseFloat(betAmount) * 100);
    if (isNaN(amountCents) || amountCents < 100) return;

    try {
      await api.post("/games/bet", { amountCents });
    } catch (e) {
      console.error("Bet error:", e);
    }
  };

  const handleCashOut = async () => {
    try {
      await api.post("/games/bet/cashout");
    } catch (e) {
      console.error("Cashout error:", e);
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

  const getBetStatusLabel = (betStatus: string) => {
    if (betStatus === "CASHED_OUT") return "Ganhou";
    if (betStatus === "LOST") return "Perdeu";
    return "Ativo";
  };

  const getBetStatusColor = (betStatus: string) => {
    if (betStatus === "CASHED_OUT") return "text-green-400";
    if (betStatus === "LOST") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-400">Crash Game</h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Saldo</p>
            <p className="text-2xl font-bold">
              R$ {(balance / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <CrashGraph />
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
                <BetsList bets={bets} />
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
                      Saldo insuficiente (R$ {(balance / 100).toFixed(2)})
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
                      R$ {potentialPayout.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      @ {multiplier.toFixed(2)}x
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handlePlaceBet}
                    disabled={!canPlaceBet}
                    className={`w-full font-bold text-lg ${
                      canPlaceBet
                        ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {!canBet
                      ? "Aguarde..."
                      : !isValidAmount
                      ? "Valor inválido"
                      : !hasSufficientBalance
                      ? "Saldo insuficiente"
                      : "Apostar"}
                  </Button>

                  <Button
                    onClick={handleCashOut}
                    disabled={!canCashOut}
                    className={`w-full font-bold text-lg ${
                      canCashOut
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 animate-pulse"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {canCashOut
                      ? `Cash Out @ ${multiplier.toFixed(2)}x`
                      : userBet?.status === "CASHED_OUT"
                      ? `Cash Out @ ${userBet.cashoutMultiplier?.toFixed(2)}x`
                      : "Cash Out"}
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Minha Aposta</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {userBet ? (
                      <div className="flex justify-between text-sm">
                        <span>R$ {(userBet.amountCents / 100).toFixed(2)}</span>
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
                <div className="flex gap-1 flex-wrap">
                  {[2.1, 1.5, 3.2, 1.0, 5.7, 1.2, 10.3, 1.0, 2.8, 1.0, 1.3, 2.2, 1.0, 4.5, 1.0].map(
                    (crash, i) => (
                      <div
                        key={i}
                        className={`w-10 h-8 rounded flex items-center justify-center text-xs font-bold ${
                          crash < 1.5
                            ? "bg-red-900 text-red-400"
                            : crash < 3
                            ? "bg-yellow-900 text-yellow-400"
                            : "bg-green-900 text-green-400"
                        }`}
                      >
                        {crash.toFixed(1)}x
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
