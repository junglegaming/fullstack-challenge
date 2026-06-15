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

vi.mock("../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof api>();
  return {
    ...actual,
    getRoundVerification: vi.fn(),
  };
});

describe("CrashChart provably fair display", () => {
  beforeEach(() => {
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

  it("draws the chart curve upward as the multiplier increases", () => {
    const { container, rerender } = renderWithProviders(
      <CrashChart
        round={{
          ...mockRunningRound,
          currentMultiplier: "1.00",
        }}
      />,
    );
    const initialPoints = container
      .querySelector(".curve-path")
      ?.getAttribute("points");

    rerender(
      <CrashChart
        round={{
          ...mockRunningRound,
          currentMultiplier: "6.00",
        }}
      />,
    );
    const updatedPoints = container
      .querySelector(".curve-path")
      ?.getAttribute("points");
    const parsedPoints = parseSvgPoints(updatedPoints ?? "");
    const firstPoint = parsedPoints[0]!;
    const lastPoint = parsedPoints[parsedPoints.length - 1]!;
    const risesAcrossChart = parsedPoints.every((point, index) => {
      if (index === 0) {
        return true;
      }

      return point[1] <= parsedPoints[index - 1]![1];
    });

    expect(initialPoints).toContain("96.00,92.00");
    expect(lastPoint[1]).toBeLessThan(firstPoint[1]);
    expect(risesAcrossChart).toBe(true);
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

function parseSvgPoints(points: string): Array<[number, number]> {
  return points.split(" ").map((point) => {
    const [x, y] = point.split(",").map(Number);
    return [x!, y!];
  });
}
