import type { ReactNode } from "react";
import type { Wallet } from "../services/api";
import { getUsername, logout } from "../services/auth";
import { useGameStore } from "../stores/game-store";

export type WalletDisplayStatus =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "error";

type GameHeaderProps = {
  wallet?: Wallet;
  walletStatus?: WalletDisplayStatus;
  walletErrorMessage?: string;
};

export function GameHeader({
  wallet,
  walletErrorMessage,
  walletStatus = wallet ? "ready" : "loading",
}: GameHeaderProps) {
  const connected = useGameStore((state) => state.connected);

  return (
    <header className="game-header">
      <div>
        <span className="eyebrow">Logged as</span>
        <strong>{getUsername()}</strong>
      </div>
      <div>
        <span className="eyebrow">Balance</span>
        <strong>{formatWalletBalance(wallet, walletStatus, walletErrorMessage)}</strong>
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

function formatWalletBalance(
  wallet: Wallet | undefined,
  status: WalletDisplayStatus,
  errorMessage: string | undefined,
): ReactNode {
  if (wallet && status === "ready") {
    return `$ ${wallet.balanceFormatted}`;
  }

  if (status === "unauthenticated") {
    return "Sign in required";
  }

  if (status === "error") {
    return errorMessage ?? "Balance unavailable";
  }

  return <WalletLoadingBalance />;
}

function WalletLoadingBalance() {
  return (
    <span className="wallet-loading" data-testid="wallet-loading-state">
      <span aria-hidden="true" className="loading-spinner" />
      Loading...
    </span>
  );
}
