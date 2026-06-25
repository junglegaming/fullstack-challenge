import { useEffect, useState } from "react";
import type { GameState } from "../game/gameState";
import { formatMultiplier } from "../utils/format";
import { CrashChart } from "./CrashChart";

interface Props {
  state: GameState;
}

const DEFAULT_BETTING_MS = 8000;

export function Stage({ state }: Props) {
  const { phase, multiplier, crashPoint, bettingEndsAt, bettingDurationMs } = state;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== "betting") {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [phase]);

  const remainingMs =
    phase === "betting" && bettingEndsAt ? Math.max(0, bettingEndsAt - now) : 0;
  const durationMs = bettingDurationMs ?? DEFAULT_BETTING_MS;
  const countdownPct = Math.min(100, (remainingMs / durationMs) * 100);

  return (
    <div className="card stage">
      <CrashChart phase={phase} multiplier={multiplier} crashPoint={crashPoint} />

      <div className="stage-overlay">
        <div className={`multiplier ${phase}`}>
          {phase === "betting"
            ? formatMultiplier(1)
            : phase === "crashed"
              ? formatMultiplier(crashPoint)
              : formatMultiplier(multiplier)}
        </div>
        <div className="stage-status">{statusText(phase, remainingMs)}</div>
      </div>

      {phase === "betting" && (
        <div className="countdown-bar" style={{ width: `${countdownPct}%` }} />
      )}
    </div>
  );
}

function statusText(phase: GameState["phase"], remainingMs: number): JSX.Element | string {
  switch (phase) {
    case "connecting":
      return "Conectando…";
    case "betting":
      return (
        <>
          Apostas abertas — <strong>{(remainingMs / 1000).toFixed(1)}s</strong>
        </>
      );
    case "running":
      return "Em voo — saque antes do crash!";
    case "crashed":
      return (
        <>
          <strong>Crashou!</strong> Nova rodada em instantes…
        </>
      );
    default:
      return "";
  }
}
