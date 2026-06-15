import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BettingControls } from "./BettingControls";
import {
  mockBettingRound,
  mockPlacedBet,
  mockRunningRound,
  mockWallet,
} from "../test/fixtures";

describe("BettingControls", () => {
  it("validates bet amount and disables bet for invalid input", async () => {
    const user = userEvent.setup();

    render(
      <BettingControls
        cashingOut={false}
        onCashOut={vi.fn()}
        onPlaceBet={vi.fn()}
        placingBet={false}
        round={mockBettingRound}
        wallet={mockWallet}
      />,
    );

    const betButton = screen.getByRole("button", { name: "Bet" });
    const amountInput = screen.getByLabelText("Amount");

    expect(betButton).toBeEnabled();

    await user.clear(amountInput);
    await user.type(amountInput, "abc");

    expect(betButton).toBeDisabled();

    await user.clear(amountInput);
    await user.type(amountInput, "0.50");

    expect(betButton).toBeDisabled();
  });

  it("disables cash out when user has no active bet", () => {
    render(
      <BettingControls
        cashingOut={false}
        onCashOut={vi.fn()}
        onPlaceBet={vi.fn()}
        placingBet={false}
        round={mockRunningRound}
        wallet={mockWallet}
      />,
    );

    expect(screen.getByRole("button", { name: "Cash Out" })).toBeDisabled();
  });

  it("enables cash out when user has a placed bet during running round", () => {
    render(
      <BettingControls
        cashingOut={false}
        myActiveBet={mockPlacedBet}
        onCashOut={vi.fn()}
        onPlaceBet={vi.fn()}
        placingBet={false}
        round={mockRunningRound}
        wallet={mockWallet}
      />,
    );

    expect(screen.getByRole("button", { name: "Cash Out" })).toBeEnabled();
  });
});
