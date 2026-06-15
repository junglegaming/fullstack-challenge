import { useEffect, useRef } from "react";
import { useGameStore } from "../stores/game-store";
import {
  calibrateStartedAtMs,
  getServerNowMs,
  parseMultiplierValue,
  resolveRunningMultiplierDisplay,
} from "../utils/multiplier-growth";

export function useVisualMultiplier(): void {
  const currentRound = useGameStore((state) => state.currentRound);
  const latestMultiplierTick = useGameStore(
    (state) => state.latestMultiplierTick,
  );
  const multiplierGrowthConfig = useGameStore(
    (state) => state.multiplierGrowthConfig,
  );
  const serverTimeOffsetMs = useGameStore((state) => state.serverTimeOffsetMs);
  const setVisualMultiplier = useGameStore((state) => state.setVisualMultiplier);
  const calibratedStartedAtRef = useRef<number | null>(null);
  const roundIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentRound?.id !== roundIdRef.current) {
      roundIdRef.current = currentRound?.id ?? null;
      calibratedStartedAtRef.current = null;
    }
  }, [currentRound?.id]);

  useEffect(() => {
    if (
      !currentRound?.startedAt ||
      currentRound.status !== "RUNNING" ||
      !latestMultiplierTick
    ) {
      return;
    }

    const startedAtMs = new Date(currentRound.startedAt).getTime();

    calibratedStartedAtRef.current = calibrateStartedAtMs(
      calibratedStartedAtRef.current ?? startedAtMs,
      {
        multiplier: parseMultiplierValue(latestMultiplierTick.multiplier),
        at: latestMultiplierTick.at,
      },
      multiplierGrowthConfig,
    );
  }, [
    currentRound?.startedAt,
    currentRound?.status,
    latestMultiplierTick,
    multiplierGrowthConfig,
  ]);

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

    const startedAtMs = new Date(currentRound.startedAt).getTime();

    if (calibratedStartedAtRef.current === null) {
      calibratedStartedAtRef.current = startedAtMs;
    }

    let frameId = 0;

    const update = () => {
      const anchorStartedAtMs = calibratedStartedAtRef.current ?? startedAtMs;
      const serverNowMs = getServerNowMs(serverTimeOffsetMs);

      setVisualMultiplier(
        resolveRunningMultiplierDisplay(
          serverNowMs,
          anchorStartedAtMs,
          multiplierGrowthConfig,
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
    multiplierGrowthConfig,
    serverTimeOffsetMs,
    setVisualMultiplier,
  ]);
}
