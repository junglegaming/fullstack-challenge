const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCents(cents: string | null | undefined): string {
  if (cents == null) {
    return "—";
  }
  const value = Number(BigInt(cents)) / 100;
  return brl.format(value);
}

export function formatReais(decimal: string | null | undefined): string {
  if (decimal == null) {
    return "—";
  }
  return brl.format(Number(decimal));
}

export function centsToDecimal(cents: string | null | undefined): string {
  if (cents == null) {
    return "0.00";
  }
  const negative = cents.startsWith("-");
  const digits = (negative ? cents.slice(1) : cents).padStart(3, "0");
  const whole = digits.slice(0, -2);
  const frac = digits.slice(-2);
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

export function formatMultiplier(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  return `${value.toFixed(2)}x`;
}

export function multiplierClass(value: number): string {
  if (value < 2) {
    return "mult-low";
  }
  if (value < 10) {
    return "mult-mid";
  }
  return "mult-high";
}

export function shortHash(hash: string | null | undefined, len = 10): string {
  if (!hash) {
    return "—";
  }
  return hash.length <= len * 2 ? hash : `${hash.slice(0, len)}…${hash.slice(-len)}`;
}
