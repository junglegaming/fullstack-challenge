import type { GameState, HistoryItem } from "../game/gameState";
import { formatMultiplier, multiplierClass } from "../utils/format";

interface Props {
  state: GameState;
  onVerify: (roundId: string) => void;
}

export function RoundHistory({ state, onVerify }: Props) {
  const items = state.history;

  return (
    <div className="card card-pad">
      <h3 className="card-title">Histórico</h3>

      {items.length === 0 ? (
        <p className="empty">Sem rodadas anteriores ainda.</p>
      ) : (
        <div className="history-strip">
          {items.map((item: HistoryItem) => (
            <button
              key={item.roundId}
              className={`mult-tag ${multiplierClass(item.crashPoint)}`}
              title={`Rodada #${item.nonce} — verificar provably fair`}
              onClick={() => onVerify(item.roundId)}
            >
              {formatMultiplier(item.crashPoint)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
