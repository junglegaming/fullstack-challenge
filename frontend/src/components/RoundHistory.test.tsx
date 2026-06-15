import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoundHistory } from "./RoundHistory";

describe("RoundHistory", () => {
  it("renders crash points from the provided rounds", () => {
    render(
      <RoundHistory
        rounds={[
          {
            id: "round-1",
            crashPoint: "3.21",
            serverSeedHash: "hash",
            serverSeed: "seed",
            createdAt: "2026-06-15T12:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Last 1")).toBeInTheDocument();
    expect(screen.getByText("3.21x")).toBeInTheDocument();
  });
});
