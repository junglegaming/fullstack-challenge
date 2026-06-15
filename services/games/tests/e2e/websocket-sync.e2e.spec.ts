import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test";
import type { Socket } from "socket.io-client";
import { getAccessToken } from "./support/auth";
import { E2EApiClient } from "./support/api-client";
import { ensureStackIsReady, waitForBettingRound } from "./support/gameplay";
import {
  connectGameSocket,
  createGameSocket,
  trackSocketEvents,
  waitForSocketEventForRound,
} from "./support/socket-client";

setDefaultTimeout(180_000);

describe("WebSocket sync E2E", () => {
  let client: E2EApiClient;
  let socketA: Socket;
  let socketB: Socket;
  let eventsA: ReturnType<typeof trackSocketEvents>;
  let eventsB: ReturnType<typeof trackSocketEvents>;

  beforeAll(async () => {
    const token = await getAccessToken();
    client = new E2EApiClient(token);
    await ensureStackIsReady(client);

    socketA = createGameSocket();
    socketB = createGameSocket();
    eventsA = trackSocketEvents(socketA);
    eventsB = trackSocketEvents(socketB);

    await Promise.all([
      connectGameSocket(socketA),
      connectGameSocket(socketB),
    ]);
  });

  afterAll(() => {
    socketA.disconnect();
    socketB.disconnect();
  });

  it("broadcasts the same round lifecycle events to two connected clients", async () => {
    await waitForBettingRound(client);
    const targetRound = await client.getCurrentRound();
    eventsA.length = 0;
    eventsB.length = 0;

    const startedA = await waitForSocketEventForRound(
      eventsA,
      "round.started",
      targetRound.id,
      { timeoutMs: 30_000 },
    );
    const startedB = await waitForSocketEventForRound(
      eventsB,
      "round.started",
      targetRound.id,
      { timeoutMs: 30_000 },
    );

    const payloadA = startedA.payload as { roundId: string; serverSeedHash: string };
    const payloadB = startedB.payload as { roundId: string; serverSeedHash: string };

    expect(payloadA.roundId).toBe(payloadB.roundId);
    expect(payloadA.serverSeedHash).toBe(payloadB.serverSeedHash);

    const crashedA = await waitForSocketEventForRound(
      eventsA,
      "round.crashed",
      targetRound.id,
      { timeoutMs: 120_000 },
    );
    const crashedB = await waitForSocketEventForRound(
      eventsB,
      "round.crashed",
      targetRound.id,
      { timeoutMs: 120_000 },
    );

    const crashPayloadA = crashedA.payload as {
      roundId: string;
      crashPoint: string;
      serverSeedHash: string;
    };
    const crashPayloadB = crashedB.payload as {
      roundId: string;
      crashPoint: string;
      serverSeedHash: string;
    };

    expect(crashPayloadA.roundId).toBe(crashPayloadB.roundId);
    expect(crashPayloadA.roundId).toBe(targetRound.id);
    expect(crashPayloadA.crashPoint).toBe(crashPayloadB.crashPoint);
    expect(crashPayloadA.serverSeedHash).toBe(crashPayloadB.serverSeedHash);
  });
});
