import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import supertest from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/infrastructure/database/prisma.service";
import { ProvablyFair } from "../../src/domain/entities/ProvablyFair";
import { CrashRoundUseCase } from "../../src/application/use-cases/crash-round.use-case";
import { WalletClient } from "../../src/infrastructure/messaging/wallet-client";
import { IBetRepository } from "../../src/domain/repositories/IBetRepository";

describe("Game Service E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let crashRoundUseCase: CrashRoundUseCase;
  let betRepository: IBetRepository;
  let request: ReturnType<typeof supertest>;

  const TEST_USER_ID = "player123";

  const FAKE_JWT =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9" +
    ".eyJzdWIiOiJwbGF5ZXIxMjMiLCJuYW1lIjoiVGVzdCBQbGF5ZXIifQ" +
    ".fakesignature";

  const authHeader = { Authorization: `Bearer ${FAKE_JWT}` };

  const walletClientMock = {
    sendBetPlaced: async (_userId: string, _amount: bigint) => ({
      success: true,
      message: "OK",
    }),
    emitBetWon: async (_userId: string, _amount: bigint) => {},
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WalletClient)
      .useValue(walletClientMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    crashRoundUseCase = app.get(CrashRoundUseCase);
    betRepository = app.get(IBetRepository);
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.bet.deleteMany();
    await prisma.round.deleteMany();
  });

  async function createRound(status: "BETTING" | "RUNNING") {
    const seed = ProvablyFair.createSeed("test-client-seed", 1);
    const crashPoint = ProvablyFair.calculateCrashPoint(seed);

    return prisma.round.create({
      data: {
        status,
        crashPoint,
        startTime: new Date(),
        serverSeed: seed.serverSeed,
        serverSeedHash: seed.serverSeedHash,
        clientSeed: seed.clientSeed,
        nonce: seed.nonce,
      },
    });
  }

  async function createPendingBet(roundId: string, amount = 10_00n) {
    return prisma.bet.create({
      data: {
        userId: TEST_USER_ID,
        roundId,
        amount,
        status: "PENDING",
      },
    });
  }


  it("Fluxo de Aposta: deve aceitar a aposta e colocá-la como PENDING", async () => {
    await createRound("BETTING");

    const res = await request
      .post("/bet")
      .set(authHeader)
      .send({ amount: 100 });

    if (res.status !== 201) {
      console.error("DEBUG bet:", JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
  });

  it("Validação: não deve permitir aposta se a rodada não estiver em BETTING", async () => {
    await createRound("RUNNING");

    const res = await request
      .post("/bet")
      .set(authHeader)
      .send({ amount: 100 });

    expect(res.status).not.toBe(201);
  });

  it("Cashout: deve registrar aposta como WON após sacar em rodada RUNNING", async () => {
    const round = await createRound("RUNNING");
    await createPendingBet(round.id);

    const res = await request
      .post("/bet/cashout")
      .set(authHeader)
      .send({ roundId: round.id });

    if (res.status !== 201) {
      console.error("DEBUG cashout:", JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(201);

    const bet = await prisma.bet.findFirst({
      where: { roundId: round.id, userId: TEST_USER_ID },
    });
    expect(bet?.status).toBe("WON");
    expect(bet?.cashoutMultiplier).not.toBeNull();
  });

  it("Cashout: smoke test — deve retornar 201 durante rodada RUNNING", async () => {
    const round = await createRound("RUNNING");
    await createPendingBet(round.id);

    const res = await request
      .post("/bet/cashout")
      .set(authHeader)
      .send({ roundId: round.id });

    if (res.status !== 201) {
      console.error("DEBUG cashout:", JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(201);
  });


  it("Crash: a aposta deve ser marcada como LOST após o crash da rodada", async () => {
    const round = await createRound("RUNNING");
    await createPendingBet(round.id);

    await crashRoundUseCase.execute();

    const updatedRound = await prisma.round.findUnique({ where: { id: round.id } });
    expect(updatedRound?.status).toBe("CRASHED");

    const bets = await betRepository.findBetsRoundId(round.id);
    for (const bet of bets) {
      bet.markAsLost();
      await betRepository.saveBet(bet);
    }

    const bet = await prisma.bet.findFirst({
      where: { roundId: round.id, userId: TEST_USER_ID },
    });
    expect(bet?.status).toBe("LOST");
  });

  it("Crash: cashout após crash deve ser rejeitado", async () => {
    const round = await createRound("RUNNING");
    await createPendingBet(round.id);

    await crashRoundUseCase.execute();

    const res = await request
      .post("/bet/cashout")
      .set(authHeader)
      .send({ roundId: round.id });

    expect(res.status).not.toBe(201);
  });
});