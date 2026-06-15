import type { CurrentRound } from "../services/api";
import { useGameStore } from "../stores/game-store";
import { FairnessCommitment } from "./FairnessCommitment";
import { RoundVerificationPanel } from "./RoundVerificationPanel";

type CrashChartProps = {
  round: CurrentRound | null;
};

function isPreCrashStatus(status: CurrentRound["status"] | undefined): boolean {
  return status === "BETTING" || status === "RUNNING";
}

function isPostCrashStatus(status: CurrentRound["status"] | undefined): boolean {
  return status === "CRASHED" || status === "SETTLED";
}

export function CrashChart({ round }: CrashChartProps) {
  const multiplier = useGameStore((state) => state.visualMultiplier);
  const numericMultiplier = Number(multiplier);
  const curveHeight = Math.min(86, 24 + numericMultiplier * 12);

  return (
    <section className={`panel crash-panel status-${round?.status ?? "LOADING"}`}>
      <div className="chart-topline">
        <span className="eyebrow">Current round</span>
        <span className="round-status">{round?.status ?? "LOADING"}</span>
      </div>
      <div className="multiplier-display">{multiplier}x</div>
      <div className="crash-chart" aria-label="Crash multiplier chart">
        <div className="grid-line" />
        <div
          className="curve"
          style={{ transform: `translateY(-${curveHeight}px)` }}
        />
      </div>
      {round && isPreCrashStatus(round.status) ? (
        <FairnessCommitment serverSeedHash={round.serverSeedHash} />
      ) : null}
      {round && isPostCrashStatus(round.status) ? (
        <RoundVerificationPanel roundId={round.id} />
      ) : null}
    </section>
  );
}
