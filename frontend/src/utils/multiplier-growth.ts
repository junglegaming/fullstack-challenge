export type MultiplierGrowthConfig = {
  growthBasisPointsPerSecond: number;
  boostAfterGainedBasisPoints?: number;
  boostGrowthBasisPointsPerSecond?: number;
  highBoostAfterGainedBasisPoints?: number;
  highGrowthBasisPointsPerSecond?: number;
};

type GrowthSegment = {
  growthBasisPointsPerSecond: number;
  untilGainedBasisPoints: number | null;
};

function buildGrowthSegments(config: MultiplierGrowthConfig): GrowthSegment[] {
  const segments: GrowthSegment[] = [
    {
      growthBasisPointsPerSecond: config.growthBasisPointsPerSecond,
      untilGainedBasisPoints: config.boostAfterGainedBasisPoints ?? null,
    },
  ];

  if (
    config.boostAfterGainedBasisPoints !== undefined &&
    config.boostGrowthBasisPointsPerSecond !== undefined &&
    config.boostGrowthBasisPointsPerSecond > config.growthBasisPointsPerSecond
  ) {
    segments[0].untilGainedBasisPoints = config.boostAfterGainedBasisPoints;
    segments.push({
      growthBasisPointsPerSecond: config.boostGrowthBasisPointsPerSecond,
      untilGainedBasisPoints: config.highBoostAfterGainedBasisPoints ?? null,
    });
  }

  if (
    config.highBoostAfterGainedBasisPoints !== undefined &&
    config.highGrowthBasisPointsPerSecond !== undefined &&
    segments.length > 0
  ) {
    const lastSegment = segments[segments.length - 1]!;
    lastSegment.untilGainedBasisPoints = config.highBoostAfterGainedBasisPoints;
    segments.push({
      growthBasisPointsPerSecond: config.highGrowthBasisPointsPerSecond,
      untilGainedBasisPoints: null,
    });
  }

  return segments;
}

export function calculateMultiplierBasisPoints(
  elapsedMs: number,
  config: MultiplierGrowthConfig,
): number {
  return 100 + calculateGainedBasisPoints(elapsedMs, config);
}

export function calculateGainedBasisPoints(
  elapsedMs: number,
  config: MultiplierGrowthConfig,
): number {
  if (elapsedMs <= 0) {
    return 0;
  }

  const segments = buildGrowthSegments(config);
  let remainingMs = elapsedMs;
  let gainedBps = 0;

  for (const segment of segments) {
    const capacityBps =
      segment.untilGainedBasisPoints === null
        ? Number.POSITIVE_INFINITY
        : segment.untilGainedBasisPoints - gainedBps;

    if (!Number.isFinite(capacityBps)) {
      return (
        gainedBps +
        Math.floor((remainingMs * segment.growthBasisPointsPerSecond) / 1000)
      );
    }

    const segmentDurationMs = Math.ceil(
      (capacityBps * 1000) / segment.growthBasisPointsPerSecond,
    );

    if (remainingMs <= segmentDurationMs) {
      return (
        gainedBps +
        Math.floor((remainingMs * segment.growthBasisPointsPerSecond) / 1000)
      );
    }

    remainingMs -= segmentDurationMs;
    gainedBps = segment.untilGainedBasisPoints!;
  }

  const lastSegment = segments[segments.length - 1]!;
  return (
    gainedBps +
    Math.floor((remainingMs * lastSegment.growthBasisPointsPerSecond) / 1000)
  );
}

export function formatMultiplierFromBasisPoints(basisPoints: number): string {
  const whole = Math.floor(basisPoints / 100);
  const fraction = (basisPoints % 100).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function calculateMultiplierDisplay(
  elapsedMs: number,
  config: MultiplierGrowthConfig,
): string {
  const gainedBps = calculateGainedBasisPoints(elapsedMs, config);
  return formatMultiplierFromBasisPoints(100 + gainedBps);
}

export type MultiplierTickSnapshot = {
  multiplier: number;
  at: number;
};

export function parseMultiplierValue(multiplier: string): number {
  const parsed = Number(multiplier);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function formatMultiplierValue(multiplier: number): string {
  const basisPoints = Math.max(100, Math.round(multiplier * 100));
  return formatMultiplierFromBasisPoints(basisPoints);
}

export function interpolateMultiplierBetweenTicks(
  from: MultiplierTickSnapshot | null,
  to: MultiplierTickSnapshot | null,
  now: number,
): string {
  if (!to) {
    return "1.00";
  }

  if (!from || from.at >= to.at) {
    return formatMultiplierValue(to.multiplier);
  }

  const progress = Math.min(
    1,
    Math.max(0, (now - from.at) / (to.at - from.at)),
  );
  const value = from.multiplier + (to.multiplier - from.multiplier) * progress;

  return formatMultiplierValue(value);
}

export function resolveEffectiveGrowthBps(
  elapsedMs: number,
  config: MultiplierGrowthConfig,
): number {
  const segments = buildGrowthSegments(config);
  let remainingMs = elapsedMs;
  let gainedBps = 0;

  for (const segment of segments) {
    const capacityBps =
      segment.untilGainedBasisPoints === null
        ? Number.POSITIVE_INFINITY
        : segment.untilGainedBasisPoints - gainedBps;

    if (!Number.isFinite(capacityBps)) {
      return segment.growthBasisPointsPerSecond;
    }

    const segmentDurationMs = Math.ceil(
      (capacityBps * 1000) / segment.growthBasisPointsPerSecond,
    );

    if (remainingMs <= segmentDurationMs) {
      return segment.growthBasisPointsPerSecond;
    }

    remainingMs -= segmentDurationMs;
    gainedBps = segment.untilGainedBasisPoints!;
  }

  return segments[segments.length - 1]!.growthBasisPointsPerSecond;
}

export function calibrateStartedAtMs(
  startedAtMs: number,
  tick: MultiplierTickSnapshot,
  config: MultiplierGrowthConfig,
): number {
  const elapsedAtTick = Math.max(0, tick.at - startedAtMs);
  const computed = parseMultiplierValue(
    calculateMultiplierDisplay(elapsedAtTick, config),
  );
  const bpsDiff = Math.round(tick.multiplier * 100) - Math.round(computed * 100);

  if (bpsDiff === 0) {
    return startedAtMs;
  }

  const growthBpsPerSecond = resolveEffectiveGrowthBps(elapsedAtTick, config);
  const msAdjustment = Math.round((bpsDiff * 1000) / growthBpsPerSecond);

  return startedAtMs - msAdjustment;
}

export function computeServerTimeOffsetMs(
  serverTimeIso: string,
  clientNowMs: number = Date.now(),
): number {
  return new Date(serverTimeIso).getTime() - clientNowMs;
}

export function getServerNowMs(
  serverTimeOffsetMs: number,
  clientNowMs: number = Date.now(),
): number {
  return clientNowMs + serverTimeOffsetMs;
}

export function resolveRunningMultiplierDisplay(
  serverNowMs: number,
  startedAtMs: number,
  config: MultiplierGrowthConfig,
): string {
  const elapsedMs = Math.max(0, serverNowMs - startedAtMs);
  return calculateMultiplierDisplay(elapsedMs, config);
}

export type VisualMultiplierTick = {
  multiplier: string;
  at: number;
};

export function resolveVisualMultiplier(input: {
  startedAtMs: number;
  serverNowMs: number;
  config: MultiplierGrowthConfig;
  latestTick: VisualMultiplierTick | null;
}): string {
  const anchorStartedAtMs = input.latestTick
    ? calibrateStartedAtMs(input.startedAtMs, {
        multiplier: parseMultiplierValue(input.latestTick.multiplier),
        at: input.latestTick.at,
      }, input.config)
    : input.startedAtMs;

  return resolveRunningMultiplierDisplay(
    input.serverNowMs,
    anchorStartedAtMs,
    input.config,
  );
}
