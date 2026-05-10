import { expect, test, describe } from "bun:test";
import { Round } from "../../src/domain/entities/Round";

describe("Entidade Round", () => {
  const clientSeed = "test-client-seed";
  const nonce = 1;

  test("deve criar uma rodada no estado BETTING", () => {
    const round = Round.create(clientSeed, nonce);
    expect(round.status).toBe("BETTING");
    expect(round.canAcceptBets()).toBe(true);
  });

  test("deve gerar um crashPoint >= 1.0 na criação", () => {
    const round = Round.create(clientSeed, nonce);
    expect(round.crashPoint).toBeGreaterThanOrEqual(1.0);
  });

  test("deve gerar crashPoints distintos para nonces distintos", () => {
    const r1 = Round.create(clientSeed, 1);
    const r2 = Round.create(clientSeed, 2);
    expect(r1.crashPoint).not.toBe(r2.crashPoint);
  });

  test("deve transitar de BETTING → RUNNING ao chamar startRound()", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    expect(round.status).toBe("RUNNING");
    expect(round.canAcceptBets()).toBe(false);
  });

  test("deve transitar de RUNNING → CRASHED ao chamar crash()", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    round.crash();
    expect(round.status).toBe("CRASHED");
  });

  test("não deve permitir startRound() se já estiver em RUNNING", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    expect(() => round.startRound()).toThrow(
      "A rodada só pode começar se estiver na fase de apostas (BETTING)"
    );
  });

  test("não deve permitir startRound() se já estiver em CRASHED", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    round.crash();
    expect(() => round.startRound()).toThrow(
      "A rodada só pode começar se estiver na fase de apostas (BETTING)"
    );
  });

  test("não deve permitir crash() se estiver em BETTING", () => {
    const round = Round.create(clientSeed, nonce);
    expect(() => round.crash()).toThrow("A rodada não está ativa para sofrer crash");
  });

  test("não deve permitir crash() se já estiver em CRASHED", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    round.crash();
    expect(() => round.crash()).toThrow("A rodada não está ativa para sofrer crash");
  });

  test("não deve revelar serverSeed em BETTING", () => {
    const round = Round.create(clientSeed, nonce);
    expect(() => round.revealSeed()).toThrow(
      "O serverSeed só pode ser revelado após o crash"
    );
  });

  test("não deve revelar serverSeed em RUNNING", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    expect(() => round.revealSeed()).toThrow(
      "O serverSeed só pode ser revelado após o crash"
    );
  });

  test("deve revelar serverSeed após CRASHED sem lançar erro", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    round.crash();
    expect(() => round.revealSeed()).not.toThrow();
  });

  test("canAcceptBets() deve retornar false em CRASHED", () => {
    const round = Round.create(clientSeed, nonce);
    round.startRound();
    round.crash();
    expect(round.canAcceptBets()).toBe(false);
  });
});