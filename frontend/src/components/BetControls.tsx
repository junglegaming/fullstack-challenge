import { useMemo, useState } from "react";
import { api, ApiError } from "../api/client";
import { gameRules } from "../config";
import type { GameState, LiveBet } from "../game/gameState";
import { formatCents, formatReais } from "../utils/format";
import { useToast } from "./Toast";

interface Props {
  state: GameState;
  username: string;
  authenticated: boolean;
  onLogin: () => void;
  onWalletShouldRefresh: () => void;
}

const QUICK = ["5", "10", "50", "100"];

export function BetControls({
  state,
  username,
  authenticated,
  onLogin,
  onWalletShouldRefresh,
}: Props) {
  const [amount, setAmount] = useState("10");
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const myBet: LiveBet | undefined = useMemo(
    () => state.bets.find((b) => b.username === username),
    [state.bets, username],
  );

  if (!authenticated) {
    return (
      <div className="card card-pad">
        <h3 className="card-title">Apostar</h3>
        <p className="bet-hint">Entre com sua conta para jogar.</p>
        <button className="btn bet" onClick={onLogin}>
          Entrar para apostar
        </button>
      </div>
    );
  }

  const placeBet = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < gameRules.minBet || value > gameRules.maxBet) {
      toast.show(`Aposta entre ${gameRules.minBet} e ${gameRules.maxBet}.`);
      return;
    }
    setPending(true);
    try {
      await api.placeBet(value.toFixed(2));
      onWalletShouldRefresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Não foi possível apostar.");
    } finally {
      setPending(false);
    }
  };

  const cashOut = async () => {
    setPending(true);
    try {
      const result = await api.cashOut();
      onWalletShouldRefresh();
      const at = result.cashOutMultiplier;
      toast.show(at ? `Sacou em ${at.toFixed(2)}x! 🎉` : "Cash out realizado!", "success");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Não foi possível sacar.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="card card-pad">
      <h3 className="card-title">
        Apostar
        <span className="chip">
          mín {gameRules.minBet} · máx {gameRules.maxBet}
        </span>
      </h3>
      {renderBody()}
      <p className="bet-hint">{hint()}</p>
    </div>
  );

  function hint(): string {
    if (state.phase === "betting") {
      return "Faça sua aposta antes do tempo acabar.";
    }
    if (state.phase === "running") {
      return "Saque antes do crash para garantir o prêmio.";
    }
    return " ";
  }

  function renderBody() {
    if (state.phase === "running" && myBet?.status === "ACTIVE") {
      const potential =
        (Number(myBet.amountCents) / 100) * state.multiplier;
      return (
        <button className="btn cashout" onClick={cashOut} disabled={pending}>
          Sacar {formatReais(potential.toFixed(2))}
          <span className="sub">
            {formatCents(myBet.amountCents)} × {state.multiplier.toFixed(2)}x
          </span>
        </button>
      );
    }

    if (myBet && myBet.status !== "PENDING" && myBet.status !== "ACTIVE") {
      return <BetResult bet={myBet} />;
    }

    if (myBet) {
      const label =
        myBet.status === "PENDING"
          ? "Confirmando aposta…"
          : "Aposta confirmada — aguardando o início";
      return (
        <div className="bet-result">
          <div className="big">{formatCents(myBet.amountCents)}</div>
          <p className="bet-hint">{label}</p>
        </div>
      );
    }

    const canBet = state.phase === "betting" && !pending;
    return (
      <>
        <div className="field">
          <label htmlFor="amount">Valor da aposta (R$)</label>
          <div className="amount-input">
            <span>R$</span>
            <input
              id="amount"
              inputMode="decimal"
              value={amount}
              disabled={!canBet}
              onChange={(e) => setAmount(e.target.value.replace(",", "."))}
            />
          </div>
        </div>
        <div className="quick-amounts">
          {QUICK.map((q) => (
            <button key={q} disabled={!canBet} onClick={() => setAmount(q)}>
              {q}
            </button>
          ))}
        </div>
        <button className="btn bet" onClick={placeBet} disabled={!canBet}>
          {state.phase === "betting" ? "Apostar" : "Aguardando próxima rodada"}
        </button>
      </>
    );
  }
}

function BetResult({ bet }: { bet: LiveBet }) {
  if (bet.status === "CASHED_OUT") {
    return (
      <div className="bet-result win">
        <div className="big">+{formatCents(bet.payoutCents)}</div>
        <p className="bet-hint">
          Você sacou em {bet.cashOutMultiplier?.toFixed(2)}x 🎉
        </p>
      </div>
    );
  }
  if (bet.status === "REJECTED") {
    return (
      <div className="bet-result loss">
        <div className="big">Rejeitada</div>
        <p className="bet-hint">Aposta não aceita (saldo insuficiente?).</p>
      </div>
    );
  }
  return (
    <div className="bet-result loss">
      <div className="big">−{formatCents(bet.amountCents)}</div>
      <p className="bet-hint">Não deu tempo de sacar 💥</p>
    </div>
  );
}
