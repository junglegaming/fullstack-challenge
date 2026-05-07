"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bet } from "@/stores/game-store";
import { formatCurrency } from "@/lib/utils";

interface BetsListProps {
  bets: Bet[];
}

export function BetsList({ bets }: BetsListProps) {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
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
    ? "bg-[#00ff88]/10 border border-[#00ff88]/20"
    : isLost
      ? "bg-[#ff0055]/10 border border-[#ff0055]/20"
      : "bg-[#1a1a2a] border border-[#ffffff]/5";

  const statusLabel = isCashedOut
    ? "Ganhou"
    : isLost
      ? "Perdeu"
      : "Ativo";

  const statusColor = isCashedOut
    ? "text-[#00ff88]"
    : isLost
      ? "text-[#ff0055]"
      : "text-[#ffaa00]";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={`flex justify-between items-center p-3 rounded-lg ${bgClass} hover:bg-opacity-20 transition-all duration-200`}
    >
      <div>
        <p className="font-medium text-sm text-white">{bet.playerId.slice(0, 8)}...</p>
        <p className="text-sm text-gray-400">
          {formatCurrency(bet.amountCents)}
        </p>
      </div>
      <div className="text-right">
        {isCashedOut ? (
          <div>
            <p className="text-[#00ff88] font-bold text-sm">
              {bet.cashoutMultiplier?.toFixed(2)}x
            </p>
            <p className="text-sm text-gray-400">
              Payout: {formatCurrency((bet.cashoutMultiplier || 0) * (bet.amountCents / 100))}
            </p>
          </div>
        ) : (
          <span className={`text-sm font-bold ${statusColor}`}>
            {statusLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
});
