import { io, type Socket } from "socket.io-client";
import { E2E_CONFIG } from "./config";
import { waitFor } from "./poll";

export type SocketEventRecord = {
  event: string;
  payload: unknown;
  receivedAt: string;
};

export function createGameSocket(): Socket {
  return io(E2E_CONFIG.websocketUrl, {
    transports: ["websocket", "polling"],
    reconnection: false,
  });
}

export async function connectGameSocket(socket: Socket): Promise<void> {
  if (socket.connected) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for socket connection"));
    }, 10_000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.once("connect_error", (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

export function trackSocketEvents(socket: Socket): SocketEventRecord[] {
  const records: SocketEventRecord[] = [];
  const events = [
    "round.betting_started",
    "round.started",
    "round.multiplier_tick",
    "bet.accepted",
    "bet.cashed_out",
    "round.crashed",
    "round.settled",
  ] as const;

  for (const event of events) {
    socket.on(event, (payload: unknown) => {
      records.push({
        event,
        payload,
        receivedAt: new Date().toISOString(),
      });
    });
  }

  return records;
}

export async function waitForSocketEventForRound(
  records: SocketEventRecord[],
  event: string,
  roundId: string,
  options?: { timeoutMs?: number },
): Promise<SocketEventRecord> {
  return waitFor(`socket event ${event} for round ${roundId}`, async () => {
    const match = records.find((record) => {
      if (record.event !== event) {
        return false;
      }

      const payload = record.payload as { roundId?: string };
      return payload.roundId === roundId;
    });

    if (!match) {
      return null;
    }

    return match;
  }, options);
}
