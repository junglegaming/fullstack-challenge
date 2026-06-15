import { useEffect, useRef } from "react";
import { useGameStore } from "../stores/game-store";
import { createMultiplierGrowthConfig } from "../utils/multiplier-config";
import {
  calibrateStartedAtMs,
  resolveRunningMultiplierDisplay,
} from "../utils/multiplier-growth";

export function useVisualMultiplier(): void {
  const currentRound = useGameStore((state) => state.currentRound);
  const multiplierToTick = useGameStore((state) => state.multiplierToTick);
  const setVisualMultiplier = useGameStore((state) => state.setVisualMultiplier);
  const calibratedStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentRound) {
      calibratedStartedAtRef.current = null;
      return;
    }

    if (
      currentRound.status === "CRASHED" ||
      currentRound.status === "SETTLED"
    ) {
      calibratedStartedAtRef.current = null;
      setVisualMultiplier(currentRound.currentMultiplier);
      return;
    }

    if (currentRound.status !== "RUNNING" || !currentRound.startedAt) {
      calibratedStartedAtRef.current = null;
      setVisualMultiplier("1.00");
      return;
    }

    const growthConfig = createMultiplierGrowthConfig();
    const startedAtMs = new Date(currentRound.startedAt).getTime();

    if (calibratedStartedAtRef.current === null) {
      calibratedStartedAtRef.current = startedAtMs;
    }

    let frameId = 0;

    const update = () => {
      const anchorStartedAtMs = calibratedStartedAtRef.current ?? startedAtMs;

      setVisualMultiplier(
        resolveRunningMultiplierDisplay(
          Date.now(),
          anchorStartedAtMs,
          growthConfig,
          currentRound.currentMultiplier,
        ),
      );

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    currentRound,
    currentRound?.status,
    currentRound?.startedAt,
    currentRound?.currentMultiplier,
    setVisualMultiplier,
  ]);

  useEffect(() => {
    if (
      !currentRound?.startedAt ||
      currentRound.status !== "RUNNING" ||
      !multiplierToTick
    ) {
      return;
    }

    const growthConfig = createMultiplierGrowthConfig();
    const startedAtMs = new Date(currentRound.startedAt).getTime();

    calibratedStartedAtRef.current = calibrateStartedAtMs(
      calibratedStartedAtRef.current ?? startedAtMs,
      multiplierToTick,
      growthConfig,
    );
  }, [currentRound?.startedAt, currentRound?.status, multiplierToTick]);
}
