import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrashChart } from "./CrashChart";
import { GameHeader } from "./GameHeader";
import { Toasts } from "./Toasts";
import { useToastStore } from "../stores/toast-store";

describe("UI loading and error states", () => {
  it("displays wallet loading state in game header", () => {
    render(<GameHeader />);

    expect(screen.getByTestId("wallet-loading-state")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays wallet error state in game header", () => {
    render(
      <GameHeader
        walletErrorMessage="Wallet service unavailable"
        walletStatus="error"
      />,
    );

    expect(screen.getByText("Wallet service unavailable")).toBeInTheDocument();
  });

  it("displays unauthenticated wallet state in game header", () => {
    render(<GameHeader walletStatus="unauthenticated" />);

    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });

  it("displays round loading state in crash chart", () => {
    render(<CrashChart round={null} />);

    expect(screen.getByText("LOADING")).toBeInTheDocument();
    expect(screen.getByTestId("round-loading-state")).toBeInTheDocument();
  });

  it("renders error toast when toast store is triggered", () => {
    render(<Toasts />);

    act(() => {
      useToastStore.getState().pushToast({
        type: "error",
        title: "Bet failed",
        message: "Insufficient balance",
      });
    });

    expect(screen.getByText("Bet failed")).toBeInTheDocument();
    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bet failed/i })).toHaveClass(
      "toast-error",
    );
  });
});
