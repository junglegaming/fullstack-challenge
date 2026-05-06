"use client";

import { useGameStore } from "@/stores/game-store";
import { formatCurrency } from "@/lib/utils";

export function StatusBadge({
  phase,
}: {
  phase: string;
}) {
  const getStatusLabel = (phase: string) => {
    if (phase === "BETTING") return "Fase de Apostas";
    if (phase === "RUNNING") return "Rodada em Andamento";
    if (phase === "CRASHED") return "Crashou!";
    return phase;
  };

  const getStatusColor = (phase: string) => {
    if (phase === "BETTING") return "bg-blue-600";
    if (phase === "RUNNING") return "bg-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.6)]";
    if (phase === "CRASHED") return "bg-[#ff0055] shadow-[0_0_15px_rgba(255,0,85,0.6)]";
    return "bg-gray-600";
  };

  return (
    <span
      className={`inline-block px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${getStatusColor(phase)}`}
    >
      {getStatusLabel(phase)}
    </span>
  );
}

export function MyBetDisplay({
  userBet,
}: {
  userBet: ReturnType<typeof useGameStore.getState>["userBet"];
}) {
  const getBetStatusLabel = (betStatus: string) => {
    if (betStatus === "CASHED_OUT") return "Ganhou";
    if (betStatus === "LOST") return "Perdeu";
    return "Ativo";
  };

  const getBetStatusColor = (betStatus: string) => {
    if (betStatus === "CASHED_OUT") return "text-[#00ff88] font-bold";
    if (betStatus === "LOST") return "text-[#ff0055] font-bold";
    return "text-yellow-400";
  };

  if (!userBet) {
    return <p className="text-gray-500 text-sm">Nenhuma aposta ativa</p>;
  }

  return (
    <div className="flex justify-between text-sm p-2 bg-[#1a1a2a] rounded">
      <span className="text-white font-medium">{formatCurrency(userBet.amountCents)}</span>
      <span className={getBetStatusColor(userBet.status)}>
        {getBetStatusLabel(userBet.status)}
        {userBet.cashoutMultiplier && ` @ ${userBet.cashoutMultiplier.toFixed(2)}x`}
      </span>
    </div>
  );
}

export function getBetStatusLabel(betStatus: string) {
  if (betStatus === "CASHED_OUT") return "Ganhou";
  if (betStatus === "LOST") return "Perdeu";
  return "Ativo";
}

export function getBetStatusColor(betStatus: string) {
  if (betStatus === "CASHED_OUT") return "text-[#00ff88] font-bold";
  if (betStatus === "LOST") return "text-[#ff0055] font-bold";
  return "text-yellow-400";
}
