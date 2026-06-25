import { useEffect, useRef, useState } from "react";
import { setTokenProvider } from "./api/client";
import { useAuth } from "./auth/AuthProvider";
import { BetControls } from "./components/BetControls";
import { Header } from "./components/Header";
import { LiveBets } from "./components/LiveBets";
import { LoginScreen } from "./components/LoginScreen";
import { ProvablyFairModal } from "./components/ProvablyFairModal";
import { RoundHistory } from "./components/RoundHistory";
import { Stage } from "./components/Stage";
import { useGameState } from "./game/useGameState";
import { useWallet } from "./game/useWallet";

export default function App() {
  const { ready, authenticated, username, getToken, login, logout } = useAuth();

  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);

  const { state, connected } = useGameState();
  const { wallet, refresh } = useWallet(authenticated);
  const [verifyRoundId, setVerifyRoundId] = useState<string | null>(null);

  const prevPhase = useRef(state.phase);
  useEffect(() => {
    if (
      state.phase === "crashed" &&
      prevPhase.current !== "crashed" &&
      authenticated
    ) {
      refresh();
    }
    prevPhase.current = state.phase;
  }, [state.phase, authenticated, refresh]);

  if (!ready) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <span>Carregando…</span>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="app">
      <Header
        authenticated={authenticated}
        username={username}
        wallet={wallet}
        connected={connected}
        onLogin={login}
        onLogout={logout}
      />

      <div className="grid">
        <div className="col">
          <Stage state={state} />
          <LiveBets state={state} username={username} />
        </div>

        <div className="col">
          <BetControls
            state={state}
            username={username}
            authenticated={authenticated}
            onLogin={login}
            onWalletShouldRefresh={refresh}
          />
          <RoundHistory state={state} onVerify={setVerifyRoundId} />
        </div>
      </div>

      {verifyRoundId && (
        <ProvablyFairModal
          roundId={verifyRoundId}
          onClose={() => setVerifyRoundId(null)}
        />
      )}
    </div>
  );
}
