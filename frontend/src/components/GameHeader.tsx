import type { Wallet } from "../services/api";
import { getUsername, logout } from "../services/auth";
import { useGameStore } from "../stores/game-store";

type GameHeaderProps = {
  wallet?: Wallet;
};

export function GameHeader({ wallet }: GameHeaderProps) {
  const connected = useGameStore((state) => state.connected);

  return (
    <header className="game-header">
      <div>
        <span className="eyebrow">Logged as</span>
        <strong>{getUsername()}</strong>
      </div>
      <div>
        <span className="eyebrow">Balance</span>
        <strong>{wallet ? `$ ${wallet.balanceFormatted}` : "Loading..."}</strong>
      </div>
      <div className={`connection ${connected ? "online" : "offline"}`}>
        {connected ? "Live connected" : "Live offline"}
      </div>
      <button className="ghost-button" onClick={logout} type="button">
        Logout
      </button>
    </header>
  );
}
