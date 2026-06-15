import { useMemo, useState } from "react";
import type { BetSummary, CurrentRound, Wallet } from "../services/api";
import { useBettingCountdown } from "../hooks/useBettingCountdown";
import { useVisualMultiplier } from "../hooks/useVisualMultiplier";
import {
  estimatePayoutCents,
  formatCents,
} from "../utils/crash-chart-math";

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
  const countdown = useBettingCountdown(round?.status, round?.bettingEndsAt);
  const currentMultiplier = useVisualMultiplier(round);
  const amountCents = useMemo(() => decimalToCents(amount), [amount]);
  const balanceCents = BigInt(wallet?.balanceCents ?? "0");
  const potentialPayoutCents =
    myActiveBet?.status === "PLACED"
      ? estimatePayoutCents(myActiveBet.amountCents, currentMultiplier)
      : null;
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
  const cashOutLabel = canCashOut && potentialPayoutCents
    ? `Cash Out (${formatCents(potentialPayoutCents)})`
    : "Cash Out";

  return (
    <section className="panel betting-panel">
      <span className="eyebrow">Bet controls</span>
      {countdown.isActive ? (
        <p className="betting-countdown" data-testid="betting-countdown">
          Betting closes in <strong>{countdown.label}</strong>
        </p>
      ) : null}
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
          {cashingOut ? "Cashing out..." : cashOutLabel}
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
