"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bet } from "@/stores/game-store";

interface BetsListProps {
  bets: Bet[];
}

export function BetsList({ bets }: BetsListProps) {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      <AnimatePresence>
        {bets.map((bet) => (
          <BetItem key={bet.betId} bet={bet} />
        ))}
      </AnimatePresence>
      {bets.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          Nenhuma aposta nesta rodada
        </p>
      )}
    </div>
  );
}

interface BetItemProps {
  bet: Bet;
}

const BetItem = memo(function BetItem({ bet }: BetItemProps) {
  const isCashedOut = bet.status === "CASHED_OUT";
  const isLost = bet.status === "LOST";

  const bgClass = isCashedOut
    ? "bg-green-900/30 border border-green-700"
    : isLost
    ? "bg-red-900/30 border border-red-700"
    : "bg-gray-800";

  const statusLabel = isCashedOut
    ? "Ganhou"
    : isLost
    ? "Perdeu"
    : "Ativo";

  const statusColor = isCashedOut
    ? "text-green-400"
    : isLost
    ? "text-red-400"
    : "text-yellow-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={`flex justify-between items-center p-3 rounded-lg ${bgClass}`}
    >
      <div>
        <p className="font-medium text-sm text-white">{bet.playerId.slice(0, 8)}...</p>
        <p className="text-sm text-gray-400">
          R$ {(bet.amountCents / 100).toFixed(2)}
        </p>
      </div>
      <div className="text-right">
        {isCashedOut ? (
          <div>
            <p className="text-green-400 font-bold">
              {bet.cashoutMultiplier?.toFixed(2)}x
            </p>
            <p className="text-sm text-gray-400">
              Payout: R${" "}
              {((bet.cashoutMultiplier || 0) * (bet.amountCents / 100)).toFixed(2)}
            </p>
          </div>
        ) : (
          <span className={`text-sm ${statusColor}`}>
            {statusLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
});
