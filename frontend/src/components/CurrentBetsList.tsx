import type { BetSummary } from "../services/api";

type CurrentBetsListProps = {
  bets: BetSummary[];
};

export function CurrentBetsList({ bets }: CurrentBetsListProps) {
  return (
    <section className="panel list-panel">
      <div className="panel-heading">
        <span className="eyebrow">Current bets</span>
        <strong>{bets.length}</strong>
      </div>
      <div className="list">
        {bets.length === 0 ? (
          <p className="empty">No bets in this round yet.</p>
        ) : (
          bets.map((bet) => (
            <article className="bet-row" key={bet.id}>
              <div>
                <strong>{bet.username ?? bet.playerId ?? "player"}</strong>
                <span>{formatCents(bet.amountCents)}</span>
              </div>
              <span className={`status-pill status-${bet.status}`}>
                {bet.status}
              </span>
              <span>
                {bet.cashOutMultiplier
                  ? `${bet.cashOutMultiplier}x / ${formatCents(bet.payoutCents ?? "0")}`
                  : "-"}
              </span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatCents(value: string): string {
  const cents = BigInt(value);
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");
  return `$ ${whole}.${fraction}`;
}
