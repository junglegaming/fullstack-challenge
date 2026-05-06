"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { useRouter } from "next/navigation";
import wsService, { useGameSocket } from "@/services/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

function MultiplierChart({
  multiplier,
  status,
}: {
  multiplier: number;
  status: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0f0f23";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 0; j < h; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }

    // Curve
    if (multiplier > 1.0) {
      const points: { x: number; y: number }[] = [];

      for (let t = 0; t <= 1.0; t += 0.01) {
        const x = t * w;
        const y =
          h -
          ((Math.exp(0.06 * t * 60) - 1) /
            (Math.exp(0.06 * 60) - 1)) *
            h *
            0.8;
        points.push({ x, y });
      }

      ctx.beginPath();
      ctx.strokeStyle = status === "CRASHED" ? "#ef4444" : "#22c55e";
      ctx.lineWidth = 3;
      ctx.shadowColor =
        status === "CRASHED" ? "#ef4444" : "#22c55e";
      ctx.shadowBlur = 10;

      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Glow effect
      ctx.beginPath();
      ctx.strokeStyle =
        status === "CRASHED"
          ? "rgba(239, 68, 68, 0.3)"
          : "rgba(34, 197, 94, 0.3)";
      ctx.lineWidth = 12;
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }
  }, [multiplier, status]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-64 rounded-lg"
        style={{ width: "100%", height: "256px" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          key={multiplier}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.1 }}
          className={`text-8xl font-bold ${
            status === "CRASHED"
              ? "text-red-500"
              : status === "RUNNING"
              ? "text-green-400"
              : "text-white"
          }`}
        >
          {multiplier.toFixed(2)}x
        </motion.div>
      </div>
      {status === "CRASHED" && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold"
        >
          CRASHED
        </motion.div>
      )}
    </div>
  );
}

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

  const canBet = phase === "BETTING";
  const canCashOut = phase === "RUNNING";

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
                <MultiplierChart multiplier={multiplier} status={phase} />
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
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <AnimatePresence>
                    {bets.map((bet) => (
                      <motion.div
                        key={bet.betId}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          bet.status === "CASHED_OUT"
                            ? "bg-green-900/30 border border-green-700"
                            : bet.status === "LOST"
                            ? "bg-red-900/30 border border-red-700"
                            : "bg-gray-800"
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {bet.playerId.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-400">
                            R$ {(bet.amountCents / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          {bet.status === "CASHED_OUT" ? (
                            <div>
                              <p className="text-green-400 font-bold">
                                {bet.cashoutMultiplier?.toFixed(2)}x
                              </p>
                              <p className="text-sm text-gray-400">
                                Payout: R${" "}
                                {(
                                  (bet.cashoutMultiplier || 0) *
                                  (bet.amountCents / 100)
                                ).toFixed(2)}
                              </p>
                            </div>
                          ) : bet.status === "LOST" ? (
                            <span className="text-red-400">Perdeu</span>
                          ) : (
                            <span className="text-gray-400">Ativo</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {bets.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Nenhuma aposta nesta rodada
                    </p>
                  )}
                </div>
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
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="1.00"
                    max="1000.00"
                    step="0.01"
                    className="bg-gray-800 border-gray-700"
                    disabled={!canBet}
                  />
                  <div className="flex gap-2 mt-2">
                    {["10", "50", "100", "500"].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBetAmount(val)}
                        disabled={!canBet}
                        className="flex-1 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handlePlaceBet}
                    disabled={!canBet}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                  >
                    {canBet ? "Apostar" : "Aguarde..."}
                  </Button>

                  <Button
                    onClick={handleCashOut}
                    disabled={!canCashOut}
                    className={`w-full ${
                      canCashOut
                        ? "bg-red-600 hover:bg-red-700 animate-pulse"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {canCashOut
                      ? `Cash Out (${multiplier.toFixed(2)}x)`
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
