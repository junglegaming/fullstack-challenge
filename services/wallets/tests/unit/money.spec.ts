import { expect, test, describe } from "bun:test";
import { Money } from "../../src/domain/value-objects/Money";

describe("Value Object Money", () => {

  test("deve criar Money a partir de centavos (BigInt)", () => {
    const money = Money.fromCents(10000n);
    expect(money.cents).toBe(10000n);
    expect(money.toDecimal()).toBe(100.0);
  });

  test("deve criar Money a partir de decimal (número)", () => {
    const money = Money.fromDecimal(100.5);
    expect(money.cents).toBe(10050n);
    expect(money.toDecimal()).toBe(100.5);
  });

  test("deve criar Money com valor zero", () => {
    const money = Money.fromCents(0n);
    expect(money.cents).toBe(0n);
  });

  test("deve arredondar corretamente valores com mais de 2 casas decimais", () => {
    const money = Money.fromDecimal(10.005);
    expect(money.cents).toBe(1001n);
  });

  test("deve representar R$ 0,01 sem perda de precisão", () => {
    const money = Money.fromCents(1n);
    expect(money.toDecimal()).toBeCloseTo(0.01, 10);
    expect(money.toString()).toBe("0.01");
  });

  test("deve representar grandes valores sem overflow (bigint)", () => {
    const largeCents = 999_999_999_99n;
    const money = Money.fromCents(largeCents);
    expect(money.cents).toBe(largeCents);
  });

  test("deve lançar erro para valores negativos (fromCents)", () => {
    expect(() => Money.fromCents(-100n)).toThrow("Money não pode ser negativo");
  });

  test("deve lançar erro para valores negativos (fromDecimal)", () => {
    expect(() => Money.fromDecimal(-50.0)).toThrow("Money não pode ser negativo");
  });

  test("deve lançar erro para NaN", () => {
    expect(() => Money.fromDecimal(NaN)).toThrow("Valor inválido");
  });

  test("deve somar dois Money corretamente", () => {
    const m1 = Money.fromCents(10000n);
    const m2 = Money.fromCents(5000n);
    expect(m1.add(m2).cents).toBe(15000n);
  });

  test("deve somar Money com zero sem alterar o valor", () => {
    const money = Money.fromCents(10000n);
    expect(money.add(Money.fromCents(0n)).cents).toBe(10000n);
  });

  test("add() deve retornar nova instância (imutabilidade)", () => {
    const m1 = Money.fromCents(10000n);
    const m2 = Money.fromCents(5000n);
    const result = m1.add(m2);
    expect(result).not.toBe(m1);
    expect(m1.cents).toBe(10000n); 
  });

  test("deve subtrair dois Money corretamente", () => {
    const m1 = Money.fromCents(10000n);
    const m2 = Money.fromCents(5000n);
    expect(m1.subtract(m2).cents).toBe(5000n);
  });

  test("deve subtrair até zero sem lançar erro (saldo exato)", () => {
    const money = Money.fromCents(10000n);
    expect(money.subtract(Money.fromCents(10000n)).cents).toBe(0n);
  });

  test("deve lançar erro ao subtrair valor maior que disponível", () => {
    const m1 = Money.fromCents(5000n);
    const m2 = Money.fromCents(10000n);
    expect(() => m1.subtract(m2)).toThrow("Saldo insuficiente");
  });

  test("subtract() deve retornar nova instância (imutabilidade)", () => {
    const m1 = Money.fromCents(10000n);
    const result = m1.subtract(Money.fromCents(3000n));
    expect(result).not.toBe(m1);
    expect(m1.cents).toBe(10000n);
  });


  test("isGreaterThanOrEqual: maior retorna true", () => {
    expect(Money.fromCents(10000n).isGreaterThanOrEqual(Money.fromCents(5000n))).toBe(true);
  });

  test("isGreaterThanOrEqual: igual retorna true", () => {
    expect(Money.fromCents(10000n).isGreaterThanOrEqual(Money.fromCents(10000n))).toBe(true);
  });

  test("isGreaterThanOrEqual: menor retorna false", () => {
    expect(Money.fromCents(5000n).isGreaterThanOrEqual(Money.fromCents(10000n))).toBe(false);
  });

  test("equals: mesmos centavos retorna true", () => {
    expect(Money.fromCents(10000n).equals(Money.fromCents(10000n))).toBe(true);
  });

  test("equals: centavos diferentes retorna false", () => {
    expect(Money.fromCents(10000n).equals(Money.fromCents(5000n))).toBe(false);
  });

  test("deve calcular payout com multiplicador de crash (2.5×)", () => {
    const bet = Money.fromCents(10000n);
    const payoutCents = BigInt(Math.round(Number(bet.cents) * 2.5));
    const payout = Money.fromCents(payoutCents);
    expect(payout.cents).toBe(25000n);
  });

  test("deve multiplicar por 1.0× sem alterar o valor", () => {
    const money = Money.fromCents(10000n);
    const result = Money.fromCents(BigInt(Math.round(Number(money.cents) * 1.0)));
    expect(result.equals(money)).toBe(true);
  });

  test("deve multiplicar por multiplicador fracionário com arredondamento correto", () => {
    const bet = Money.fromCents(10000n);
    const payout = Money.fromCents(BigInt(Math.round(Number(bet.cents) * 1.337)));
    expect(payout.cents).toBe(13370n);
  });

  test("deve converter para string formatada com 2 casas decimais", () => {
    expect(Money.fromCents(10050n).toString()).toBe("100.50");
  });

  test("deve serializar cents como string para JSON (sem perda de bigint)", () => {
    const money = Money.fromCents(10000n);
    const json = JSON.stringify({ amount: money.cents.toString() });
    expect(json).toBe('{"amount":"10000"}');
  });
});