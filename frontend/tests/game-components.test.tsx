import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { useGameStore } from "@/stores/game-store";
import { StatusBadge, MyBetDisplay } from "@/components/game-components";
import { BetsList } from "@/components/bets-list";
import { RoundHistory } from "@/components/round-history";
import { BetControls } from "@/app/game/page";
import { formatCurrency } from "@/lib/utils";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => {
  // Use React.createElement instead of JSX to avoid parsing issues
  const createElement = React.createElement;
  return {
    motion: {
      div: (props: any) => createElement("div", props, props.children),
      button: (props: any) => createElement("button", props, props.children),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock next/dynamic to render components directly
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (importFn: any) => {
    const mod = importFn();
    return mod.then((m: any) => m.default || m);
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("StatusBadge", () => {
  it("should render BETTING phase", () => {
    render(<StatusBadge phase="BETTING" />);
    expect(screen.getByText("Fase de Apostas")).toBeInTheDocument();
  });

  it("should render RUNNING phase", () => {
    render(<StatusBadge phase="RUNNING" />);
    expect(screen.getByText("Rodada em Andamento")).toBeInTheDocument();
  });

  it("should render CRASHED phase", () => {
    render(<StatusBadge phase="CRASHED" />);
    expect(screen.getByText("Crashou!")).toBeInTheDocument();
  });
});

describe("MyBetDisplay", () => {
  beforeEach(() => {
    useGameStore.setState({
      currentRound: null,
      multiplier: 1.0,
      phase: "BETTING",
      bets: [],
      userBet: null,
      balance: 10000,
      roundHistory: [],
    });
  });

  it("should show no active bet message when userBet is null", () => {
    render(<MyBetDisplay userBet={null} />);
    expect(screen.getByText("Nenhuma aposta ativa")).toBeInTheDocument();
  });

  it("should display pending bet correctly", () => {
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "PENDING" as const,
    };
    render(<MyBetDisplay userBet={userBet} />);
    expect(screen.getByText(/10,00/)).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("should display cashed out bet with multiplier", () => {
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "CASHED_OUT" as const,
      cashoutMultiplier: 2.5,
      payoutCents: 2500,
    };
    render(<MyBetDisplay userBet={userBet} />);
    expect(screen.getByText(/Ganhou/)).toBeInTheDocument();
    expect(screen.getByText(/2.50x/)).toBeInTheDocument();
  });

  it("should display lost bet", () => {
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "LOST" as const,
    };
    render(<MyBetDisplay userBet={userBet} />);
    expect(screen.getByText("Perdeu")).toBeInTheDocument();
  });
});

describe("BetsList", () => {
  const mockBets = [
    {
      betId: "bet-1",
      playerId: "player1",
      amountCents: 1000,
      status: "PENDING" as const,
    },
    {
      betId: "bet-2",
      playerId: "player2",
      amountCents: 5000,
      status: "CASHED_OUT" as const,
      cashoutMultiplier: 3.0,
    },
    {
      betId: "bet-3",
      playerId: "player3",
      amountCents: 2000,
      status: "LOST" as const,
    },
  ];

  it("should render empty state when no bets", () => {
    render(<BetsList bets={[]} />);
    expect(screen.getByText("Nenhuma aposta nesta rodada")).toBeInTheDocument();
  });

  it("should render all bets", () => {
    render(<BetsList bets={mockBets} />);
    expect(screen.getByText("player1...")).toBeInTheDocument();
    expect(screen.getByText("player2...")).toBeInTheDocument();
    expect(screen.getByText("player3...")).toBeInTheDocument();
  });

  it("should show correct status for each bet", () => {
    render(<BetsList bets={mockBets} />);
    expect(screen.getByText(/Ativo/)).toBeInTheDocument();
    expect(screen.getByText(/3.00x/)).toBeInTheDocument();
    expect(screen.getByText(/Perdeu/)).toBeInTheDocument();
  });

  it("should show cashout multiplier for cashed out bets", () => {
    render(<BetsList bets={mockBets} />);
    expect(screen.getByText("3.00x")).toBeInTheDocument();
  });
});

describe("RoundHistory", () => {
  it("should render empty state when no history", () => {
    useGameStore.setState({ roundHistory: [] });
    render(<RoundHistory />);
    expect(screen.getByText("Aguardando rodadas...")).toBeInTheDocument();
  });

  it("should render history items with correct formatting", () => {
    useGameStore.setState({ roundHistory: [2.5, 1.8, 5.0] });
    render(<RoundHistory />);
    expect(screen.getByText("2.5x")).toBeInTheDocument();
    expect(screen.getByText("1.8x")).toBeInTheDocument();
    expect(screen.getByText("5.0x")).toBeInTheDocument();
  });

  it("should apply correct color for low crash points", () => {
    useGameStore.setState({ roundHistory: [1.2] });
    const { container } = render(<RoundHistory />);
    const item = container.querySelector("[class*='bg-\\[\\#ff0055\\]']");
    expect(item).toBeInTheDocument();
  });

  it("should apply correct color for high crash points", () => {
    useGameStore.setState({ roundHistory: [3.0] });
    const { container } = render(<RoundHistory />);
    const item = container.querySelector("[class*='bg-\\[\\#00ff88\\]']");
    expect(item).toBeInTheDocument();
  });
});

describe("BetControls", () => {
  const defaultProps = {
    betAmount: "10.00",
    phase: "BETTING" as string,
    userBet: null as any,
    balance: 10000, // R$ 100.00
    isPlacingBet: false,
    isCashingOut: false,
    onBetAmountChange: vi.fn(),
    onPlaceBet: vi.fn(),
    onCashOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render bet input with correct value", () => {
    render(<BetControls {...defaultProps} />);
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("10.00");
  });

  it("should render quick bet buttons", () => {
    render(<BetControls {...defaultProps} />);
    expect(screen.getByText("R$ 10")).toBeInTheDocument();
    expect(screen.getByText("R$ 50")).toBeInTheDocument();
    expect(screen.getByText("R$ 100")).toBeInTheDocument();
    expect(screen.getByText("R$ 500")).toBeInTheDocument();
  });

  it("should call onBetAmountChange when quick bet button clicked", () => {
    const onBetAmountChange = vi.fn();
    render(
      <BetControls {...defaultProps} onBetAmountChange={onBetAmountChange} />,
    );
    fireEvent.click(screen.getByText("R$ 50"));
    expect(onBetAmountChange).toHaveBeenCalledWith("50");
  });

  it("should update input value when changed", () => {
    const onBetAmountChange = vi.fn();
    render(
      <BetControls {...defaultProps} onBetAmountChange={onBetAmountChange} />,
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "50.00" } });
    expect(onBetAmountChange).toHaveBeenCalledWith("50.00");
  });

  it("should disable place bet button when not in BETTING phase", () => {
    render(<BetControls {...defaultProps} phase="RUNNING" />);
    const button = screen.getByText("AGUARDE...");
    expect(button).toBeDisabled();
  });

  it("should disable place bet button when user already has a bet", () => {
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "PENDING" as const,
    };
    render(<BetControls {...defaultProps} userBet={userBet} />);
    const button = screen.getByText("AGUARDE...");
    expect(button).toBeDisabled();
  });

  it("should enable place bet button when conditions are met", () => {
    render(<BetControls {...defaultProps} />);
    const button = screen.getByText("APOSTAR");
    expect(button).not.toBeDisabled();
  });

  it("should show insufficient balance message", () => {
    render(<BetControls {...defaultProps} betAmount="200.00" balance={10000} />);
    expect(screen.getByText(/Saldo insuficiente/)).toBeInTheDocument();
  });

  it("should disable place bet button with insufficient balance", () => {
    render(<BetControls {...defaultProps} betAmount="200.00" balance={10000} />);
    const button = screen.getByText("SALDO INSUFICIENTE");
    expect(button).toBeDisabled();
  });

  it("should call onPlaceBet when place bet button clicked", () => {
    const onPlaceBet = vi.fn();
    render(<BetControls {...defaultProps} onPlaceBet={onPlaceBet} />);
    fireEvent.click(screen.getByText("APOSTAR"));
    expect(onPlaceBet).toHaveBeenCalled();
  });

  it("should disable cashout button when not in RUNNING phase", () => {
    render(<BetControls {...defaultProps} />);
    const button = screen.getByText("CASH OUT");
    expect(button).toBeDisabled();
  });

  it("should enable cashout button when in RUNNING phase with pending bet", () => {
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "PENDING" as const,
    };
    render(
      <BetControls
        {...defaultProps}
        phase="RUNNING"
        userBet={userBet}
        multiplier={2.0}
      />,
    );
    const button = screen.getByRole("button", { name: /CASH OUT/ });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("should call onCashOut when cashout button clicked", () => {
    const onCashOut = vi.fn();
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "PENDING" as const,
    };
    render(
      <BetControls
        {...defaultProps}
        phase="RUNNING"
        userBet={userBet}
        onCashOut={onCashOut}
      />,
    );
    fireEvent.click(screen.getByText(/CASH OUT/));
    expect(onCashOut).toHaveBeenCalled();
  });

  it("should display cashed out state correctly", () => {
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "CASHED_OUT" as const,
      cashoutMultiplier: 2.5,
    };
    render(
      <BetControls
        {...defaultProps}
        phase="RUNNING"
        userBet={userBet}
      />,
    );
    expect(screen.getByText(/CASH OUT @ 2.50x/)).toBeInTheDocument();
  });

  it("should show potential payout", () => {
    render(<BetControls {...defaultProps} betAmount="10.00" />);
    // Potential payout at 1.00x should be R$ 10,00
    expect(screen.getByText("R$ 10,00")).toBeInTheDocument();
  });

  it("should show loading state when placing bet", () => {
    render(<BetControls {...defaultProps} isPlacingBet={true} />);
    expect(screen.getByText("APOSTANDO...")).toBeInTheDocument();
  });

  it("should show loading state when cashing out", () => {
    const userBet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "PENDING" as const,
    };
    render(
      <BetControls
        {...defaultProps}
        phase="RUNNING"
        userBet={userBet}
        isCashingOut={true}
      />,
    );
    expect(screen.getByText("CASH OUT...")).toBeInTheDocument();
  });
});
