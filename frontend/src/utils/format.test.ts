import { describe, expect, it } from "bun:test";
import {
  centsToDecimal,
  formatCents,
  formatMultiplier,
  multiplierClass,
  shortHash,
} from "./format";

describe("centsToDecimal", () => {
  it("converte centavos em decimal com duas casas", () => {
    expect(centsToDecimal("1050")).toBe("10.50");
    expect(centsToDecimal("100000")).toBe("1000.00");
  });

  it("preenche valores menores que um real", () => {
    expect(centsToDecimal("5")).toBe("0.05");
    expect(centsToDecimal("50")).toBe("0.50");
  });

  it("preserva o sinal negativo", () => {
    expect(centsToDecimal("-250")).toBe("-2.50");
  });

  it("trata nulo como zero", () => {
    expect(centsToDecimal(null)).toBe("0.00");
    expect(centsToDecimal(undefined)).toBe("0.00");
  });
});

describe("formatCents", () => {
  it("formata como moeda brasileira", () => {
    const out = formatCents("1050");
    expect(out.startsWith("R$")).toBe(true);
    expect(out).toContain("10,50");
  });

  it("usa travessao para valor ausente", () => {
    expect(formatCents(null)).toBe("—");
  });
});

describe("formatMultiplier", () => {
  it("formata com duas casas e sufixo x", () => {
    expect(formatMultiplier(1)).toBe("1.00x");
    expect(formatMultiplier(2.5)).toBe("2.50x");
  });

  it("usa travessao para nulo", () => {
    expect(formatMultiplier(null)).toBe("—");
  });
});

describe("multiplierClass", () => {
  it("classifica por faixa de risco", () => {
    expect(multiplierClass(1.2)).toBe("mult-low");
    expect(multiplierClass(2)).toBe("mult-mid");
    expect(multiplierClass(9.99)).toBe("mult-mid");
    expect(multiplierClass(10)).toBe("mult-high");
  });
});

describe("shortHash", () => {
  it("encurta hashes longos preservando inicio e fim", () => {
    const hash = "a".repeat(20) + "b".repeat(20);
    expect(shortHash(hash, 6)).toBe("aaaaaa…bbbbbb");
  });

  it("mantem hashes curtos intactos", () => {
    expect(shortHash("abc", 6)).toBe("abc");
  });

  it("usa travessao para vazio", () => {
    expect(shortHash(null)).toBe("—");
  });
});
