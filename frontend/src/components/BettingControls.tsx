import { useMemo, useState } from "react";
import type { BetSummary, CurrentRound, Wallet } from "../services/api";

type BettingControlsProps = {
  wallet?: Wallet;
  round: CurrentRound | null;
  myActiveBet?: BetSummary;
  onPlaceBet: (amountCents: string) => void;
  onCashOut: () => void;
  placingBet: boolean;
  cashingOut: boolean;
};

export function BettingControls({
  wallet,
  round,
  myActiveBet,
  onPlaceBet,
  onCashOut,
  placingBet,
  cashingOut,
}: BettingControlsProps) {
  const [amount, setAmount] = useState("10.00");
  const amountCents = useMemo(() => decimalToCents(amount), [amount]);
  const balanceCents = BigInt(wallet?.balanceCents ?? "0");
  const canBet =
    round?.status === "BETTING" &&
    amountCents !== null &&
    amountCents >= 100n &&
    amountCents <= 100000n &&
    amountCents <= balanceCents &&
    !placingBet;
  const canCashOut =
    round?.status === "RUNNING" &&
    myActiveBet?.status === "PLACED" &&
    !cashingOut;

  return (
    <section className="panel betting-panel">
      <span className="eyebrow">Bet controls</span>
      <label className="field">
        Amount
        <input
          inputMode="decimal"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="10.00"
          value={amount}
        />
      </label>
      <p className="hint">Min $1.00, max $1000.00. Actions are sent by REST.</p>
      <div className="button-row">
        <button
          className="primary-button"
          disabled={!canBet}
          onClick={() => amountCents && onPlaceBet(amountCents.toString())}
          type="button"
        >
          {placingBet ? "Placing..." : "Bet"}
        </button>
        <button
          className="cashout-button"
          disabled={!canCashOut}
          onClick={onCashOut}
          type="button"
        >
          {cashingOut ? "Cashing out..." : "Cash Out"}
        </button>
      </div>
      <p className="hint">
        {round?.status === "BETTING"
          ? "Betting is open."
          : round?.status === "RUNNING"
            ? "Round is running. Cash out before crash."
            : "Wait for the next betting phase."}
      </p>
    </section>
  );
}

function decimalToCents(value: string): bigint | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) {
    return null;
  }

  const [whole, fraction = ""] = value.split(".");
  return BigInt(`${whole}${fraction.padEnd(2, "0")}`);
}
