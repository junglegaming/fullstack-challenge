import { useMemo } from "react";
import type { GameState, LiveBet } from "../game/gameState";
import { formatCents, formatMultiplier } from "../utils/format";

interface Props {
  state: GameState;
  username: string;
}

const STATUS_LABEL: Record<LiveBet["status"], string> = {
  PENDING: "Confirmando",
  ACTIVE: "Na rodada",
  CASHED_OUT: "Sacou",
  LOST: "Perdeu",
  REJECTED: "Rejeitada",
};

export function LiveBets({ state, username }: Props) {
  const bets = useMemo(() => {
    const copy = state.bets.slice();
    copy.sort((a, b) => {

      if (a.username === username) return -1;
      if (b.username === username) return 1;
      return Number(BigInt(b.amountCents) - BigInt(a.amountCents));
    });
    return copy;
  }, [state.bets, username]);

  return (
    <div className="card card-pad">
      <h3 className="card-title">
        Apostas da rodada
        <span className="chip">{bets.length}</span>
      </h3>

      {bets.length === 0 ? (
        <p className="empty">Nenhuma aposta ainda nesta rodada.</p>
      ) : (
        <div className="bets">
          {bets.map((bet) => (
            <div
              key={bet.betId}
              className={`bet-row${bet.username === username ? " mine" : ""}`}
            >
              <div className="bet-user">
                <span className="avatar">
                  {bet.username.charAt(0).toUpperCase()}
                </span>
                <span className="name">
                  {bet.username === username ? "Você" : bet.username}
                </span>
              </div>
              <span className="bet-amount">
                {bet.status === "CASHED_OUT" && bet.cashOutMultiplier
                  ? `${formatCents(bet.payoutCents)} · ${formatMultiplier(
                      bet.cashOutMultiplier,
                    )}`
                  : formatCents(bet.amountCents)}
              </span>
              <span className={`status-badge status-${bet.status}`}>
                {STATUS_LABEL[bet.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
