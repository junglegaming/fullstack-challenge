import type { CurrentRound } from "../services/api";
import { useVisualMultiplier } from "../hooks/useVisualMultiplier";
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
  const visualMultiplier = useVisualMultiplier(round);

  if (!round) {
    return (
      <section className="panel crash-panel status-LOADING">
        <div className="chart-topline">
          <span className="eyebrow">Current round</span>
          <span className="round-status">LOADING</span>
        </div>
        <div className="loading-state" data-testid="round-loading-state">
          <span aria-hidden="true" className="loading-spinner" />
          <span className="loading-skeleton multiplier-skeleton" />
          <span className="loading-skeleton chart-skeleton" />
        </div>
      </section>
    );
  }

  const multiplier = visualMultiplier;
  const numericMultiplier = Number(multiplier);
  const progress = Number.isFinite(numericMultiplier)
    ? Math.min(1, Math.max(0, (numericMultiplier - 1) / 10))
    : 0;
  const curvePoints = buildUpwardCurvePoints(progress);
  const [, endY] = curvePoints[curvePoints.length - 1]!;
  const points = curvePoints
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  return (
    <section className={`panel crash-panel status-${round.status}`}>
      <div className="chart-topline">
        <span className="eyebrow">Current round</span>
        <span className="round-status">{round.status}</span>
      </div>
      <div className="multiplier-display">{multiplier}x</div>
      <div className="crash-chart" aria-label="Crash multiplier chart">
        <div className="grid-line" />
        <svg className="curve" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100">
          <polyline className="curve-path" points={points} />
          <circle className="curve-point" cx="96" cy={endY} r="2.8" />
        </svg>
      </div>
      {isPreCrashStatus(round.status) ? (
        <FairnessCommitment serverSeedHash={round.serverSeedHash} />
      ) : null}
      {isPostCrashStatus(round.status) ? (
        <RoundVerificationPanel roundId={round.id} />
      ) : null}
    </section>
  );
}

export function buildUpwardCurvePoints(progress: number): Array<[number, number]> {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const pointCount = 24;
  const startX = 4;
  const endX = 96;
  const baselineY = 92;
  const rise = clampedProgress * 70;

  return Array.from({ length: pointCount }, (_, index) => {
    const t = index / (pointCount - 1);
    const x = startX + (endX - startX) * t;
    const y = baselineY - rise * t ** 2.35;

    return [x, y];
  });
}
