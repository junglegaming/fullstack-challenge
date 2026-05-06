"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

const LOW_THRESHOLD = 1.5;

export function RoundHistory() {
  const roundHistory = useGameStore((s) => s.roundHistory);

  if (roundHistory.length === 0) {
    return (
      <div className="flex gap-1 flex-wrap min-h-[32px] items-center">
        <span className="text-xs text-gray-600">Aguardando rodadas...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {roundHistory.map((crashPoint, i) => {
        const isLow = crashPoint < LOW_THRESHOLD;
        return (
          <motion.div
            key={`${crashPoint}-${i}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className={`w-10 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
              isLow
                ? "bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/30"
                : "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
            }`}
            style={{
              textShadow: isLow
                ? "0 0 8px rgba(255,0,85,0.5)"
                : "0 0 8px rgba(0,255,136,0.5)",
            }}
          >
            {crashPoint.toFixed(1)}x
          </motion.div>
        );
      })}
    </div>
  );
}
