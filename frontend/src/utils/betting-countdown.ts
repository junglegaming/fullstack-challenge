export function getBettingSecondsRemaining(
  bettingEndsAt: string,
  nowMs = Date.now(),
): number {
  const endsAtMs = new Date(bettingEndsAt).getTime();

  if (!Number.isFinite(endsAtMs)) {
    return 0;
  }

  return Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
}

export function formatBettingCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
