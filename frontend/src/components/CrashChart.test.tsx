import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrashChart } from "./CrashChart";
import * as api from "../services/api";
import {
  mockBettingRound,
  mockCrashedRound,
  mockRunningRound,
  mockServerSeedHash,
} from "../test/fixtures";
import { renderWithProviders } from "../test/test-utils";
import { useGameStore } from "../stores/game-store";

vi.mock("../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof api>();
  return {
    ...actual,
    getRoundVerification: vi.fn(),
  };
});

describe("CrashChart provably fair display", () => {
  beforeEach(() => {
    useGameStore.setState({ visualMultiplier: "1.00" });
    vi.mocked(api.getRoundVerification).mockResolvedValue({
      roundId: mockCrashedRound.id,
      serverSeed: "revealed-server-seed-value",
      serverSeedHash: mockServerSeedHash,
      clientSeed: "client-seed",
      nonce: 1,
      algorithm: "HMAC_SHA256_SHA256_HASH_COMMITMENT",
      houseEdgePercent: 3,
      crashPoint: "2.45",
    });
  });

  it("shows truncated serverSeedHash during betting", () => {
    renderWithProviders(<CrashChart round={mockBettingRound} />);

    expect(screen.getByText("Fairness commitment")).toBeInTheDocument();
    expect(screen.getByText("aabbccdd…66778899")).toBeInTheDocument();
    expect(screen.queryByText(mockServerSeedHash)).not.toBeInTheDocument();
    expect(screen.queryByTestId("verification-server-seed")).not.toBeInTheDocument();
  });

  it("hides serverSeed before crash", () => {
    renderWithProviders(<CrashChart round={mockRunningRound} />);

    expect(screen.getByText("Fairness commitment")).toBeInTheDocument();
    expect(screen.queryByText("revealed-server-seed-value")).not.toBeInTheDocument();
    expect(screen.queryByTestId("verification-server-seed")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verify round" })).not.toBeInTheDocument();
  });

  it("shows verify details after crash", async () => {
    const user = userEvent.setup();

    renderWithProviders(<CrashChart round={mockCrashedRound} />);

    expect(screen.queryByText("Fairness commitment")).not.toBeInTheDocument();
    expect(screen.queryByText(mockServerSeedHash)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Verify round" }));

    await waitFor(() => {
      expect(screen.getByText("Verified")).toBeInTheDocument();
    });

    expect(screen.getByTestId("verification-server-seed")).toHaveTextContent(
      "revealed-server-seed-value",
    );
    expect(screen.getByTestId("verification-server-seed-hash")).toHaveTextContent(
      mockServerSeedHash,
    );
    expect(screen.getByTestId("verification-crash-point")).toHaveTextContent("2.45x");
  });
});
