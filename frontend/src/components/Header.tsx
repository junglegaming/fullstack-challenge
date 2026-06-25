import type { WalletDto } from "../api/types";
import { formatReais } from "../utils/format";

interface Props {
  authenticated: boolean;
  username: string;
  wallet: WalletDto | null;
  connected: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function Header({
  authenticated,
  username,
  wallet,
  connected,
  onLogin,
  onLogout,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo">🚀</span>
        Crash Game
      </div>

      <div className="topbar-right">
        <span className={`conn ${connected ? "on" : "off"}`}>
          <span className="dot" />
          {connected ? "ao vivo" : "offline"}
        </span>

        {authenticated ? (
          <>
            {wallet && (
              <div className="wallet">
                <span className="label">Saldo</span>
                <span className="value">{formatReais(wallet.balance)}</span>
              </div>
            )}
            <div className="user-pill">
              <span className="avatar">
                {username.charAt(0).toUpperCase()}
              </span>
              {username}
              <button className="btn-ghost" onClick={onLogout}>
                Sair
              </button>
            </div>
          </>
        ) : (
          <button className="btn-ghost" onClick={onLogin}>
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}
