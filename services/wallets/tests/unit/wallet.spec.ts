import { expect, test, describe } from "bun:test";
import { Wallet } from "../../src/domain/entities/wallet";
import { Money } from "../../src/domain/value-objects/Money";

describe("Entidade Wallet", () => {
  const makeWallet = (balanceCents = 1000n) =>
    new Wallet({
      userId: "user-1",
      balance: Money.fromCents(balanceCents),
      updatedAt: new Date(),
    });

  test("deve criar carteira com saldo inicial zero", () => {
    const wallet = makeWallet(0n);
    expect(wallet.balance.cents).toBe(0n);
    expect(wallet.userId).toBe("user-1");
  });

  test("deve criar carteira com saldo positivo", () => {
    const wallet = makeWallet(5000n);
    expect(wallet.balance.cents).toBe(5000n);
  });

  test("deve depositar dinheiro com sucesso", () => {
    const wallet = makeWallet(1000n);
    wallet.deposit(Money.fromCents(500n));
    expect(wallet.balance.cents).toBe(1500n);
  });

  test("deve depositar múltiplas vezes acumulando corretamente", () => {
    const wallet = makeWallet(0n);
    wallet.deposit(Money.fromCents(1000n));
    wallet.deposit(Money.fromCents(2000n));
    wallet.deposit(Money.fromCents(500n));
    expect(wallet.balance.cents).toBe(3500n);
  });

  test("deve depositar R$ 0,01 sem perda de precisão", () => {
    const wallet = makeWallet(0n);
    wallet.deposit(Money.fromCents(1n));
    expect(wallet.balance.cents).toBe(1n);
  });

  test("deve depositar payout de cashout (valor com multiplicador fracionário)", () => {
    const wallet = makeWallet(0n);
    const payout = Money.fromCents(BigInt(Math.round(10000 * 1.5)));
    wallet.deposit(payout);
    expect(wallet.balance.cents).toBe(15000n);
  });

  test("deve sacar dinheiro com sucesso", () => {
    const wallet = makeWallet(1000n);
    wallet.withdraw(Money.fromCents(400n));
    expect(wallet.balance.cents).toBe(600n);
  });

  test("deve sacar exatamente o saldo total (saldo = 0 após)", () => {
    const wallet = makeWallet(1000n);
    wallet.withdraw(Money.fromCents(1000n));
    expect(wallet.balance.cents).toBe(0n);
  });

  test("deve lançar erro ao sacar mais do que o saldo disponível", () => {
    const wallet = makeWallet(1000n);
    expect(() => wallet.withdraw(Money.fromCents(2000n))).toThrow(
      "Saldo insuficiente",
    );
  });

  test("deve lançar erro ao sacar de carteira com saldo zero", () => {
    const wallet = makeWallet(0n);
    expect(() => wallet.withdraw(Money.fromCents(1n))).toThrow(
      "Saldo insuficiente",
    );
  });

  test("saldo nunca deve ficar negativo após saque inválido", () => {
    const wallet = makeWallet(500n);
    try {
      wallet.withdraw(Money.fromCents(501n));
    } catch {}

    expect(wallet.balance.cents).toBe(500n);
  });

  test("sequência depósito + saque deve manter saldo consistente", () => {
    const wallet = makeWallet(0n);
    wallet.deposit(Money.fromCents(10000n));
    wallet.withdraw(Money.fromCents(3000n));
    wallet.deposit(Money.fromCents(500n));
    wallet.withdraw(Money.fromCents(2000n));
    expect(wallet.balance.cents).toBe(5500n);
  });

  test("toJSON deve retornar balance em centavos (bigint)", () => {
    const wallet = makeWallet(1000n);
    const json = wallet.toJSON();
    expect(json.userId).toBe("user-1");
    expect(json.balance).toBe(1000n);
  });
});
