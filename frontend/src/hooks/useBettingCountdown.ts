import { useEffect, useState } from "react";
import {
  formatBettingCountdown,
  getBettingSecondsRemaining,
} from "../utils/betting-countdown";

type BettingCountdownState = {
  secondsRemaining: number;
  label: string;
  isActive: boolean;
};

export function useBettingCountdown(
  status: string | undefined,
  bettingEndsAt: string | undefined,
): BettingCountdownState {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (status !== "BETTING" || !bettingEndsAt) {
      setSecondsRemaining(0);
      return;
    }

    const update = () => {
      setSecondsRemaining(getBettingSecondsRemaining(bettingEndsAt));
    };

    update();
    const intervalId = window.setInterval(update, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status, bettingEndsAt]);

  return {
    secondsRemaining,
    label: formatBettingCountdown(secondsRemaining),
    isActive: status === "BETTING" && Boolean(bettingEndsAt),
  };
}
