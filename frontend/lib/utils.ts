import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCurrency(value: string): bigint {
  if (!value) return 0n

  const cleanValue = value.replace(/\D/g, "")
  return BigInt(cleanValue)
}

export function numberToCurrency(value: bigint | string): string {
  if (typeof value === "string") {
    const cleanString = value
      .replace(/n$/, "") 
      .replace(".", "")
      .replace(",", "")
    const parsed = BigInt(cleanString || "0")
    value = parsed
  }

  if (value === 0n) {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0)
  }

  const numericValue = Number(value)
  const finalValue = numericValue / 100

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(finalValue)
}