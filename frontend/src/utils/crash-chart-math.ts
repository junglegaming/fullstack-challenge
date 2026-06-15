export type CrashCurveGeometry = {
  linePath: string;
  areaPath: string;
  tipX: number;
  tipY: number;
  displayCap: number;
};

const EXPONENTIAL_STEEPNESS = 2.8;
const CURVE_SAMPLES = 28;
const DISPLAY_CAP_TIERS = [10, 20, 50, 100, 250, 500, 1000, 2500, 10000];

export function resolveDisplayCap(multiplier: number): number {
  const target = Math.max(10, multiplier * 1.2);

  for (const tier of DISPLAY_CAP_TIERS) {
    if (target <= tier) {
      return tier;
    }
  }

  return Math.ceil(target / 500) * 500;
}

export function multiplierToTimeProgress(
  multiplier: number,
  cap = resolveDisplayCap(multiplier),
): number {
  if (multiplier <= 1) {
    return 0;
  }

  return Math.min(0.98, (multiplier - 1) / (cap - 1));
}

export function exponentialHeightProgress(
  linearProgress: number,
  steepness = EXPONENTIAL_STEEPNESS,
): number {
  if (linearProgress <= 0) {
    return 0;
  }

  if (linearProgress >= 1) {
    return 1;
  }

  return (Math.exp(linearProgress * steepness) - 1) / (Math.exp(steepness) - 1);
}

/** @deprecated Use multiplierToTimeProgress for clarity. */
export function multiplierToProgress(multiplier: number): number {
  return multiplierToTimeProgress(multiplier);
}

function pointsToLinePath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function buildCrashCurvePath(
  multiplier: number,
  width: number,
  height: number,
  padding = 16,
): CrashCurveGeometry {
  const displayCap = resolveDisplayCap(multiplier);
  const timeProgress = multiplierToTimeProgress(multiplier, displayCap);
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const startX = padding;
  const startY = height - padding;
  const points: Array<{ x: number; y: number }> = [];

  for (let index = 0; index <= CURVE_SAMPLES; index += 1) {
    const sampleTime = (index / CURVE_SAMPLES) * timeProgress;
    points.push({
      x: startX + sampleTime * plotWidth,
      y: startY - exponentialHeightProgress(sampleTime) * plotHeight,
    });
  }

  const tip = points[points.length - 1] ?? { x: startX, y: startY };
  const linePath = pointsToLinePath(points);
  const areaPath = `${linePath} L ${tip.x} ${startY} Z`;

  return {
    linePath,
    areaPath,
    tipX: tip.x,
    tipY: tip.y,
    displayCap,
  };
}

export function estimatePayoutCents(
  amountCents: string,
  multiplier: string,
): bigint {
  const [whole, fraction = "00"] = multiplier.split(".");
  const basisPoints = BigInt(
    `${whole}${fraction.padEnd(2, "0").slice(0, 2)}`,
  );

  return (BigInt(amountCents) * basisPoints) / 100n;
}

export function formatCents(value: bigint): string {
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, "0");
  return `$ ${whole}.${fraction}`;
}
