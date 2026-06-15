import { useEffect, useState } from "react";
import type { CurrentRound } from "../services/api";
import { useGameStore } from "../stores/game-store";
import {
  createFallbackMultiplierGrowthConfig,
  fromMultiplierGrowthPayload,
} from "../utils/multiplier-config";
import {
  getServerNowMs,
  resolveVisualMultiplier,
} from "../utils/multiplier-growth";

export function useVisualMultiplier(round: CurrentRound | null): string {
  const latestTick = useGameStore((state) => state.latestMultiplierTick);
  const serverTimeOffsetMs = useGameStore((state) => state.serverTimeOffsetMs);
  const fallbackMultiplier = round?.currentMultiplier ?? "1.00";
  const [displayMultiplier, setDisplayMultiplier] = useState(fallbackMultiplier);

  useEffect(() => {
    if (round?.status !== "RUNNING" || !round.startedAt) {
      setDisplayMultiplier(fallbackMultiplier);
      return;
    }

    const canAnimate =
      round.multiplierGrowth !== undefined ||
      latestTick !== null ||
      serverTimeOffsetMs !== 0;

    if (!canAnimate) {
      setDisplayMultiplier(fallbackMultiplier);
      return;
    }

    const growthConfig = round.multiplierGrowth
      ? fromMultiplierGrowthPayload(round.multiplierGrowth)
      : createFallbackMultiplierGrowthConfig();
    const startedAtMs = new Date(round.startedAt).getTime();
    let frameId = 0;
    let lastRendered = "";

    const tick = () => {
      const visual = resolveVisualMultiplier({
        startedAtMs,
        serverNowMs: getServerNowMs(serverTimeOffsetMs),
        config: growthConfig,
        latestTick,
      });

      if (visual !== lastRendered) {
        lastRendered = visual;
        setDisplayMultiplier(visual);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    fallbackMultiplier,
    latestTick,
    round?.multiplierGrowth,
    round?.startedAt,
    round?.status,
    serverTimeOffsetMs,
  ]);

  return displayMultiplier;
}
