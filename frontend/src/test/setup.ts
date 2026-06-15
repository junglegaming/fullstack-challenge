import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { useGameStore } from "../stores/game-store";
import { useToastStore } from "../stores/toast-store";

afterEach(() => {
  cleanup();
  useGameStore.setState({
    connected: false,
    visualMultiplier: "1.00",
    currentRound: null,
    roundBets: [],
    history: [],
  });
  useToastStore.setState({ toasts: [] });
});
