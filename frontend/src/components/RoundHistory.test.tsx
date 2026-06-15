import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoundHistory } from "./RoundHistory";
import * as api from "../services/api";
import {
  prependRoundHistoryCache,
  ROUND_HISTORY_QUERY_KEY,
} from "../queries/round-history";

vi.mock("../services/api", () => ({
  getRoundHistory: vi.fn(),
}));

describe("RoundHistory", () => {
  it("renders items from react query cache updates", async () => {
    vi.mocked(api.getRoundHistory).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RoundHistory />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("0 rounds")).toBeInTheDocument();

    prependRoundHistoryCache(queryClient, {
      id: "round-1",
      crashPoint: "3.21",
      serverSeedHash: "hash",
      serverSeed: "seed",
      createdAt: "2026-06-15T12:00:00.000Z",
    });

    expect(await screen.findByText("1 rounds")).toBeInTheDocument();
    expect(screen.getByText("3.21x")).toBeInTheDocument();
    expect(
      queryClient.getQueryData(ROUND_HISTORY_QUERY_KEY),
    ).toBeTruthy();
  });
});
