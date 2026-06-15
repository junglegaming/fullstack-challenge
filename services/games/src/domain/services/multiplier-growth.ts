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
