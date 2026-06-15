import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GamePage } from "./GamePage";
import * as api from "../services/api";
import * as auth from "../services/auth";
import {
  mockBettingRound,
  mockWallet,
} from "../test/fixtures";
import { renderWithProviders } from "../test/test-utils";

vi.mock("../hooks/useGameSocket", () => ({
  useGameSocket: vi.fn(),
}));

vi.mock("../services/auth", () => ({
  getAccessToken: vi.fn(() => "test-token"),
  getUsername: vi.fn(() => "player"),
  logout: vi.fn(),
}));

vi.mock("../services/api", () => ({
  getWallet: vi.fn(),
  createWallet: vi.fn(),
  getCurrentRound: vi.fn(),
  getRoundHistory: vi.fn(),
  getMyBets: vi.fn(),
  placeBet: vi.fn(),
  cashOut: vi.fn(),
}));

describe("GamePage", () => {
  beforeEach(() => {
    vi.mocked(api.getWallet).mockResolvedValue(mockWallet);
    vi.mocked(api.getCurrentRound).mockResolvedValue(mockBettingRound);
    vi.mocked(api.getRoundHistory).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    vi.mocked(api.getMyBets).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    vi.mocked(auth.getAccessToken).mockReturnValue("test-token");
  });

  it("renders game page shell", async () => {
    renderWithProviders(<GamePage />);

    expect(screen.getByRole("main")).toHaveClass("app-shell");
    expect(screen.getByText("Logged as")).toBeInTheDocument();
    expect(screen.getByText("Bet controls")).toBeInTheDocument();
    expect(screen.getByText("Current round")).toBeInTheDocument();
    expect(screen.getByLabelText("Crash multiplier chart")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("player")).toBeInTheDocument();
      expect(screen.getByText(/\$ 1000\.00/)).toBeInTheDocument();
    });
  });
});
