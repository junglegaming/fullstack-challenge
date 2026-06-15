import type { CurrentRound } from "../services/api";
import { useGameStore } from "../stores/game-store";

type CrashChartProps = {
  round: CurrentRound | null;
};

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
      <dl className="seed-grid">
        <div>
          <dt>Server seed hash</dt>
          <dd>{round?.serverSeedHash ?? "-"}</dd>
        </div>
        <div>
          <dt>Revealed seed</dt>
          <dd>{round?.serverSeed ?? "hidden until crash"}</dd>
        </div>
      </dl>
    </section>
  );
}
