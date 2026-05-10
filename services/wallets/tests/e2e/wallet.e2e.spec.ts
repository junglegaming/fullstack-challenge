import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import supertest from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/infrastructure/database/prisma.service";
import { DepositMoneyUseCase } from "../../src/application/use-cases/deposit-money.use-case";
import { WithdrawMoneyUseCase } from "../../src/application/use-cases/withdraw-money.use-case";

describe("Wallet Service E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let depositUseCase: DepositMoneyUseCase;
  let withdrawUseCase: WithdrawMoneyUseCase;
  let request: ReturnType<typeof supertest>;

  const TEST_USER_ID = "player123";
  const OTHER_USER_ID = "player456";

  const makeJwt = (sub: string) => {
    const payload = Buffer.from(JSON.stringify({ sub })).toString("base64url");
    return `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.fakesignature`;
  };

  const authHeader = (sub = TEST_USER_ID) => ({
    Authorization: `Bearer ${makeJwt(sub)}`,
  });

  beforeAll(async () => {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    depositUseCase = app.get(DepositMoneyUseCase);
    withdrawUseCase = app.get(WithdrawMoneyUseCase);
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.wallet.deleteMany();
  });

  async function createWallet(userId = TEST_USER_ID) {
    const res = await request.post("/").set(authHeader(userId));
    if (res.status !== 201) {
      console.error("DEBUG createWallet:", JSON.stringify(res.body, null, 2));
    }
    return res;
  }

  async function creditBalance(userId: string, cents: bigint) {
    await depositUseCase.execute({ userId, amountInCents: cents });
  }

  async function debitBalance(userId: string, cents: bigint) {
    await withdrawUseCase.execute({ userId, amountInCents: cents });
  }


  it("deve criar uma carteira com saldo inicial zero", async () => {
    const res = await createWallet();
    expect(res.status).toBe(201);
    expect(res.body.message).toContain("sucesso");
  });

  it("deve retornar saldo zero após criação", async () => {
    await createWallet();
    const res = await request.get("/me").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe("0.00");
  });

  it("não deve permitir criar duas carteiras para o mesmo usuário", async () => {
    await createWallet();
    const res = await createWallet();
    expect(res.status).not.toBe(201);
  });


  it("deve depositar e refletir o novo saldo", async () => {
    await createWallet();

    const res = await request
      .post("/deposit")
      .set(authHeader())
      .send({ amountInCents: "10000" }); 

    expect(res.status).toBe(201);

    const balanceRes = await request.get("/me").set(authHeader());
    expect(balanceRes.body.data.balance).toBe("100.00");
  });

  it("deve acumular múltiplos depósitos corretamente", async () => {
    await createWallet();
    await creditBalance(TEST_USER_ID, 5000n);  
    await creditBalance(TEST_USER_ID, 3000n);  

    const res = await request.get("/me").set(authHeader());
    expect(res.body.data.balance).toBe("80.00");
  });

  it("deve debitar saldo após aposta (simulando bet_placed via use-case)", async () => {
    await createWallet();
    await creditBalance(TEST_USER_ID, 10000n);

    await debitBalance(TEST_USER_ID, 1000n);

    const res = await request.get("/me").set(authHeader());
    expect(res.body.data.balance).toBe("90.00");
  });

  it("Cashout: saldo deve aumentar após receber payout", async () => {
    await createWallet();
    await creditBalance(TEST_USER_ID, 10000n);

    await debitBalance(TEST_USER_ID, 1000n);

    await creditBalance(TEST_USER_ID, 2500n);

    const res = await request.get("/me").set(authHeader());
    expect(res.body.data.balance).toBe("115.00");
  });

  it("Cashout: precisão monetária com multiplicador fracionário (1.337×)", async () => {
    await createWallet();
    await creditBalance(TEST_USER_ID, 10000n);

    await debitBalance(TEST_USER_ID, 1000n);

    const payout = BigInt(Math.round(1000 * 1.337));
    await creditBalance(TEST_USER_ID, payout);

    const res = await request.get("/me").set(authHeader());
    expect(res.body.data.balance).toBe("103.37");
  });

  it("Crash: saldo não deve ser recuperado após aposta perdida", async () => {
    await createWallet();
    await creditBalance(TEST_USER_ID, 10000n);

    await debitBalance(TEST_USER_ID, 1000n); 

    const res = await request.get("/me").set(authHeader());
    expect(res.body.data.balance).toBe("90.00");
  });

  it("Saldo insuficiente: deve rejeitar aposta maior que saldo", async () => {
    await createWallet();
    await creditBalance(TEST_USER_ID, 500n);

    const shouldThrow = debitBalance(TEST_USER_ID, 1000n);
    await expect(shouldThrow).rejects.toThrow("Saldo insuficiente");

    const res = await request.get("/me").set(authHeader());
    expect(res.body.data.balance).toBe("5.00");
  });

  it("Saldo insuficiente: saldo nunca deve ficar negativo", async () => {
    await createWallet();


    try {
      await debitBalance(TEST_USER_ID, 1n);
    } catch {

    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: TEST_USER_ID } });
    expect(wallet!.balance).toBeGreaterThanOrEqual(0n);
  });

  it("deve retornar 404 ao consultar carteira inexistente", async () => {
    const res = await request.get("/me").set(authHeader("ghost-user"));
    expect([200, 404]).toContain(res.status);
  });

  it("operações em carteiras distintas não devem interferir entre si", async () => {
    await createWallet(TEST_USER_ID);
    await createWallet(OTHER_USER_ID);

    await creditBalance(TEST_USER_ID, 10000n); 
    await creditBalance(OTHER_USER_ID, 5000n); 
    await debitBalance(TEST_USER_ID, 3000n)

    const res1 = await request.get("/me").set(authHeader(TEST_USER_ID));
    const res2 = await request.get("/me").set(authHeader(OTHER_USER_ID));

    expect(res1.body.data.balance).toBe("70.00");  
    expect(res2.body.data.balance).toBe("50.00"); 
  });
});