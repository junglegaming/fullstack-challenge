import { expect, test, describe } from "bun:test";
import { Bet } from "../../src/domain/entities/Bet";
import { BetAmount } from "../../src/domain/value-objects/BetAmount";
import { Multiplier } from "../../src/domain/value-objects/Multiplier";

describe("Entidade Bet", () => {
  const makeBet = (overrides: Partial<ConstructorParameters<typeof Bet>[0]> = {}) =>
    new Bet({
      id: "bet-1",
      userId: "user-1",
      roundId: "round-1",
      amount: 100n,
      multiplierAtCashout: null,
      status: "PENDING",
      ...overrides,
    });

  test("deve criar uma aposta com valores válidos", () => {
    const bet = makeBet();
    const json = bet.toJSON();

    expect(json.id).toBe("bet-1");
    expect(json.status).toBe("PENDING");
    expect(json.amount).toBe(100n);
    expect(json.multiplierAtCashout).toBeNull();
  });

  test("BetAmount deve rejeitar amount igual a zero", () => {
    expect(() => BetAmount.fromCents(0n)).toThrow();
  });

  test("BetAmount deve rejeitar amount negativo", () => {
    expect(() => BetAmount.fromCents(-50n)).toThrow();
  });

  test("BetAmount deve rejeitar amount abaixo do mínimo (< 100 centavos)", () => {
    expect(() => BetAmount.fromCents(99n)).toThrow();
  });

  test("BetAmount deve rejeitar amount acima do máximo (> 100000 centavos)", () => {
    expect(() => BetAmount.fromCents(100001n)).toThrow();
  });

  test("BetAmount deve aceitar o valor mínimo (100 centavos = R$ 1,00)", () => {
    expect(() => BetAmount.fromCents(100n)).not.toThrow();
  });

  test("BetAmount deve aceitar o valor máximo (100000 centavos = R$ 1000,00)", () => {
    expect(() => BetAmount.fromCents(100000n)).not.toThrow();
  });

  test("deve transitar para WON após cashout com multiplicador válido", () => {
    const bet = makeBet();
    bet.cashout(Multiplier.fromValue(2.5));
    const json = bet.toJSON();

    expect(json.status).toBe("WON");
    expect(json.multiplierAtCashout).toBe(2.5);
  });

  test("deve calcular o payout corretamente após cashout (amount × multiplier)", () => {
    const multiplier = Multiplier.fromValue(3.0);
    const payout = multiplier.calculatePayout(200n);
    expect(payout).toBe(600n);
  });

  test("deve calcular payout de 1× sem lucro", () => {
    const multiplier = Multiplier.fromValue(1.0);
    const payout = multiplier.calculatePayout(100n);
    expect(payout).toBe(100n);
  });

  test("não deve permitir cashout se a aposta já estiver WON", () => {
    const bet = makeBet();
    bet.cashout(Multiplier.fromValue(1.5));
    expect(() => bet.cashout(Multiplier.fromValue(2.0))).toThrow(
      "Aposta já foi finalizada ou não está pendente"
    );
  });

  test("não deve permitir cashout se a aposta estiver LOST", () => {
    const bet = makeBet({ status: "LOST" });
    expect(() => bet.cashout(Multiplier.fromValue(2.0))).toThrow(
      "Aposta já foi finalizada ou não está pendente"
    );
  });

  test("não deve permitir cashout com multiplicador menor que 1", () => {
    const bet = makeBet();
    expect(() => bet.cashout(Multiplier.fromValue(0.5))).toThrow();
  });

  test("deve marcar aposta PENDING como LOST", () => {
    const bet = makeBet();
    bet.markAsLost();
    expect(bet.toJSON().status).toBe("LOST");
  });

  test("markAsLost() em aposta WON é ignorado silenciosamente (design intencional)", () => {
    const bet = makeBet();
    bet.cashout(Multiplier.fromValue(2.0));
    expect(() => bet.markAsLost()).not.toThrow();
    expect(bet.toJSON().status).toBe("WON");
  });

  test("markAsLost() em aposta já LOST é ignorado silenciosamente (design intencional)", () => {
    const bet = makeBet({ status: "LOST" });
    expect(() => bet.markAsLost()).not.toThrow();
    expect(bet.toJSON().status).toBe("LOST");
  });

  test("multiplierAtCashout deve ser null após markAsLost()", () => {
    const bet = makeBet();
    bet.markAsLost();
    expect(bet.toJSON().multiplierAtCashout).toBeNull();
  });
});