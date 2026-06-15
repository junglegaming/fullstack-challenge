import type { RoundHistoryItem } from "../services/api";

type RoundHistoryProps = {
  rounds: RoundHistoryItem[];
};

export function RoundHistory({ rounds }: RoundHistoryProps) {
  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <span className="eyebrow">Round history</span>
        <strong>Last {rounds.length}</strong>
      </div>
      <div className="history-grid">
        {rounds.map((round) => (
          <span
            className={`history-chip ${getCrashTone(round.crashPoint)}`}
            key={round.id}
            title={round.serverSeedHash}
          >
            {round.crashPoint}x
          </span>
        ))}
      </div>
    </section>
  );
}

function getCrashTone(crashPoint: string): string {
  const value = Number(crashPoint);

  if (value < 1.5) {
    return "low";
  }

  if (value < 3) {
    return "medium";
  }

  return "high";
}
