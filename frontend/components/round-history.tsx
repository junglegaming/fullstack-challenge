"use client";

import { useGameStore } from "@/stores/game-store";

const LOW_THRESHOLD = 1.5;

export function RoundHistory() {
  const roundHistory = useGameStore((s) => s.roundHistory);

  if (roundHistory.length === 0) {
    return (
      <div className="flex gap-1 flex-wrap min-h-[32px] items-center">
        <span className="text-xs text-gray-500">Aguardando rodadas...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {roundHistory.map((crashPoint, i) => {
        const isLow = crashPoint < LOW_THRESHOLD;
        return (
          <div
            key={`${crashPoint}-${i}`}
            className={`w-10 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
              isLow
                ? "bg-red-900/80 text-red-400"
                : "bg-green-900/80 text-green-400"
            }`}
          >
            {crashPoint.toFixed(1)}x
          </div>
        );
      })}
    </div>
  );
}
