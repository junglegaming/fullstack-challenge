import { describe, it, beforeAll, afterAll, expect } from "bun:test";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import mikroOrmConfig from "../../src/infrastructure/persistence/mikro-orm.config";
import { WalletEntity } from "../../src/infrastructure/persistence/entities/orm/wallet.entity";
import { TransactionEntity } from "../../src/infrastructure/persistence/entities/orm/transaction.entity";
import { InboxEventEntity } from "../../src/infrastructure/persistence/entities/orm/inbox-event.orm-entity";
import { OutboxEventEntity } from "../../src/infrastructure/persistence/entities/orm/outbox-event.orm-entity";
import { WalletId } from "../../src/domain/value-objects/wallet-id.vo";
import { PlayerId } from "../../src/domain/value-objects/player-id.vo";
import { Money } from "../../src/domain/value-objects/money.vo";
import { IWalletRepository } from "../../src/application/ports/wallet-repository.port";
import { IInboxRepository } from "../../src/application/ports/inbox-repository.port";
import { IOutboxRepository } from "../../src/application/ports/outbox-repository.port";
import { CreateWalletUseCase } from "../../src/application/commands/create-wallet.usecase";
import { GetWalletUseCase } from "../../src/application/queries/get-wallet.usecase";
import { ProcessDebitUseCase } from "../../src/application/commands/process-debit.usecase";
import { ProcessCreditUseCase } from "../../src/application/commands/process-credit.usecase";
import { Wallet } from "../../src/domain/entities/wallet.entity";
import { InboxEvent } from "../../src/infrastructure/persistence/entities/inbox-event.entity";
import { OutboxEvent } from "../../src/infrastructure/persistence/entities/outbox-event.entity";
import { MikroOrmWalletRepository } from "../../src/infrastructure/persistence/repositories/mikro-orm-wallet.repository";
import { MikroOrmInboxRepository } from "../../src/infrastructure/persistence/repositories/mikro-orm-inbox.repository";
import { MikroOrmOutboxRepository } from "../../src/infrastructure/persistence/repositories/mikro-orm-outbox.repository";
import { EntityManager } from "@mikro-orm/core";
import { Injectable, Inject } from "@nestjs/common";

// RabbitMQ test container setup
let postgresContainer: StartedTestContainer;
let rabbitmqContainer: StartedTestContainer;
let orm: MikroORM<PostgreSqlDriver>;
let walletRepository: IWalletRepository;
let inboxRepository: IInboxRepository;
let outboxRepository: IOutboxRepository;
let createWalletUseCase: CreateWalletUseCase;
let getWalletUseCase: GetWalletUseCase;
let processDebitUseCase: ProcessDebitUseCase;
let processCreditUseCase: ProcessCreditUseCase;

// RabbitMQ connection details
let rabbitUrl: string;

describe("Wallet Service E2E Tests", () => {
  beforeAll(async () => {
    // Start PostgreSQL container
    console.log("Starting PostgreSQL container...");
    const postgresContainerPromise = new GenericContainer("postgres:18.3-alpine")
      .withEnvironment({
        POSTGRES_USER: "admin",
        POSTGRES_PASSWORD: "admin",
        POSTGRES_DB: "wallet_service_test",
      })
      .withExposedPort(5432)
      .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections"))
      .start();

    // Start RabbitMQ container
    console.log("Starting RabbitMQ container...");
    const rabbitmqContainerPromise = new GenericContainer("rabbitmq:4.2.4-management-alpine")
      .withExposedPort(5672)
      .withWaitStrategy(Wait.forLogMessage("Server startup complete"))
      .start();

    const [postgres, rabbitmq] = await Promise.all([
      postgresContainerPromise,
      rabbitmqContainerPromise,
    ]);

    postgresContainer = postgres;
    rabbitmqContainer = rabbitmq;

    const postgresPort = postgres.getMappedPort(5432);
    const postgresHost = postgres.getHost();

    const rabbitmqPort = rabbitmq.getMappedPort(5672);
    const rabbitmqHost = rabbitmq.getHost();
    rabbitUrl = `amqp://admin:admin@${rabbitmqHost}:${rabbitmqPort}`;

    console.log(`PostgreSQL started at ${postgresHost}:${postgresPort}`);
    console.log(`RabbitMQ started at ${rabbitmqHost}:${rabbitmqPort}`);

    // Create MikroORM instance with test container connection
    const testConfig = {
      ...mikroOrmConfig,
      host: postgresHost,
      port: postgresPort,
      user: "admin",
      password: "admin",
      dbName: "wallet_service_test",
      entities: [WalletEntity, TransactionEntity, InboxEventEntity, OutboxEventEntity],
      debug: false,
    };

    orm = await MikroORM.init<PostgreSqlDriver>(testConfig);

    // Create schema
    const generator = orm.getSchemaGenerator();
    await generator.createSchema();

    console.log("Database schema created");

    // Create repositories and use cases
    const em = orm.em.fork();

    walletRepository = new MikroOrmWalletRepository(em as any);
    inboxRepository = new MikroOrmInboxRepository(em as any);
    outboxRepository = new MikroOrmOutboxRepository(em as any);

    createWalletUseCase = new CreateWalletUseCase(walletRepository as any);
    getWalletUseCase = new GetWalletUseCase(walletRepository as any);
    processDebitUseCase = new ProcessDebitUseCase(
      walletRepository as any,
      inboxRepository as any,
      outboxRepository as any,
    );
    processCreditUseCase = new ProcessCreditUseCase(
      walletRepository as any,
      inboxRepository as any,
      outboxRepository as any,
    );

    console.log("E2E test setup complete");
  });

  afterAll(async () => {
    if (orm) {
      await orm.close();
    }
    if (postgresContainer) {
      await postgresContainer.stop();
    }
    if (rabbitmqContainer) {
      await rabbitmqContainer.stop();
    }
  });

  describe("Wallet Creation", () => {
    it("should create a wallet for a player", async () => {
      const playerId = new PlayerId("e2e-player-1");
      const initialBalance = new Money(10000n); // 100.00

      const result = await createWalletUseCase.execute({
        playerId,
        initialBalance,
      });

      expect(result.walletId).toBeDefined();
      expect(result.playerId).toBe("e2e-player-1");
      expect(result.balanceCents).toBe(10000n);

      // Verify wallet exists
      const wallet = await getWalletUseCase.execute({
        playerId: "e2e-player-1",
      });

      expect(wallet.walletId).toBe(result.walletId);
      expect(wallet.balanceCents).toBe(10000n);
    });

    it("should not create duplicate wallet for same player", async () => {
      const playerId = new PlayerId("e2e-player-2");
      const initialBalance = new Money(5000n);

      await createWalletUseCase.execute({
        playerId,
        initialBalance,
      });

      await expect(
        createWalletUseCase.execute({
          playerId,
          initialBalance,
        }),
      ).toThrow("Wallet already exists for player e2e-player-2");
    });
  });

  describe("Event Consumption - BetPlaced (Debit)", () => {
    it("should debit wallet when BetPlaced event is processed", async () => {
      // Create wallet first
      const playerId = "e2e-player-3";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(10000n),
      });

      // Get initial balance
      let wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(10000n);

      // Process debit (simulating BetPlaced event)
      const debitResult = await processDebitUseCase.execute(
        {
          playerId,
          amountCents: 3000n,
          betId: "bet-e2e-1",
        },
        "msg-bet-1",
      );

      expect(debitResult.transactionId).toBeDefined();
      expect(debitResult.newBalanceCents).toBe(7000n);

      // Verify balance updated
      wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(7000n);
      expect(wallet.transactionCount).toBe(1);
    });

    it("should reject debit with insufficient funds", async () => {
      const playerId = "e2e-player-4";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(2000n),
      });

      await expect(
        processDebitUseCase.execute(
          {
            playerId,
            amountCents: 5000n,
            betId: "bet-e2e-2",
          },
          "msg-bet-2",
        ),
      ).toThrow("Insufficient funds");

      // Verify balance unchanged
      const wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(2000n);
    });
  });

  describe("Event Consumption - CashoutRequested (Credit)", () => {
    it("should credit wallet when CashoutRequested event is processed", async () => {
      const playerId = "e2e-player-5";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(10000n),
      });

      // First debit some amount
      await processDebitUseCase.execute(
        {
          playerId,
          amountCents: 3000n,
          betId: "bet-e2e-3",
        },
        "msg-bet-3",
      );

      let wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(7000n);

      // Process credit (simulating CashoutRequested event)
      const creditResult = await processCreditUseCase.execute(
        {
          playerId,
          amountCents: 4500n, // 45.00 cashout
          betId: "bet-e2e-3",
        },
        "msg-cashout-3",
      );

      expect(creditResult.transactionId).toBeDefined();
      expect(creditResult.newBalanceCents).toBe(11500n); // 70 + 45 = 115

      // Verify balance updated
      wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(11500n);
      expect(wallet.transactionCount).toBe(2);
    });
  });

  describe("Idempotency - Duplicate Events", () => {
    it("should not alter balance on duplicate BetPlaced event", async () => {
      const playerId = "e2e-player-6";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(10000n),
      });

      // Process debit first time
      const result1 = await processDebitUseCase.execute(
        {
          playerId,
          amountCents: 2000n,
          betId: "bet-e2e-idempotent",
        },
        "msg-idempotent-1",
      );

      expect(result1.newBalanceCents).toBe(8000n);

      // Process same event again (duplicate)
      const result2 = await processDebitUseCase.execute(
        {
          playerId,
          amountCents: 2000n,
          betId: "bet-e2e-idempotent",
        },
        "msg-idempotent-1", // Same messageId
      );

      // Should return same result without double debit
      expect(result2.transactionId).toBe(result1.transactionId);
      expect(result2.newBalanceCents).toBe(8000n);

      // Verify only one transaction recorded
      const wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(8000n);
      expect(wallet.transactionCount).toBe(1);
    });

    it("should not alter balance on duplicate CashoutRequested event", async () => {
      const playerId = "e2e-player-7";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(10000n),
      });

      // Process debit first
      await processDebitUseCase.execute(
        {
          playerId,
          amountCents: 3000n,
          betId: "bet-e2e-4",
        },
        "msg-bet-4",
      );

      // Process credit first time
      const result1 = await processCreditUseCase.execute(
        {
          playerId,
          amountCents: 4500n,
          betId: "bet-e2e-4",
        },
        "msg-cashout-4",
      );

      expect(result1.newBalanceCents).toBe(11500n);

      // Process same credit again (duplicate)
      const result2 = await processCreditUseCase.execute(
        {
          playerId,
          amountCents: 4500n,
          betId: "bet-e2e-4",
        },
        "msg-cashout-4", // Same messageId
      );

      // Should return same result without double credit
      expect(result2.transactionId).toBe(result1.transactionId);
      expect(result2.newBalanceCents).toBe(11500n);

      // Verify only one credit transaction
      const wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(11500n);
      expect(wallet.transactionCount).toBe(2); // One debit + one credit
    });

    it("should handle different messageId with same referenceId (idempotency by referenceId)", async () => {
      const playerId = "e2e-player-8";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(10000n),
      });

      // Process debit
      const result1 = await processDebitUseCase.execute(
        {
          playerId,
          amountCents: 1500n,
          betId: "bet-e2e-5",
        },
        "msg-different-1",
      );

      // Process again with different messageId but same referenceId
      const result2 = await processDebitUseCase.execute(
        {
          playerId,
          amountCents: 1500n,
          betId: "bet-e2e-5", // Same betId (referenceId)
        },
        "msg-different-2", // Different messageId
      );

      // Should still be idempotent (using referenceId, not messageId)
      expect(result2.transactionId).toBe(result1.transactionId);
      expect(result2.newBalanceCents).toBe(8500n);

      const wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(8500n);
      expect(wallet.transactionCount).toBe(1);
    });
  });

  describe("System Consistency", () => {
    it("should maintain consistent balance after multiple operations", async () => {
      const playerId = "e2e-player-9";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(10000n),
      });

      // Simulate a series of bets and cashouts
      const operations = [
        { type: "debit", amount: 1000n, betId: "bet-consistency-1" },
        { type: "debit", amount: 2000n, betId: "bet-consistency-2" },
        { type: "credit", amount: 1500n, betId: "bet-consistency-1" }, // Cashout bet 1
        { type: "credit", amount: 3000n, betId: "bet-consistency-2" }, // Cashout bet 2
        { type: "debit", amount: 500n, betId: "bet-consistency-3" },
      ];

      for (const op of operations) {
        if (op.type === "debit") {
          await processDebitUseCase.execute(
            { playerId, amountCents: op.amount, betId: op.betId },
            `msg-${op.betId}`,
          );
        } else {
          await processCreditUseCase.execute(
            { playerId, amountCents: op.amount, betId: op.betId },
            `msg-${op.betId}`,
          );
        }
      }

      // Expected: 100 - 10 - 20 + 15 + 30 - 5 = 110
      const wallet = await getWalletUseCase.execute({ playerId });
      expect(wallet.balanceCents).toBe(11000n);
      expect(wallet.transactionCount).toBe(5);
    });

    it("should persist transactions in ledger correctly", async () => {
      const playerId = "e2e-player-10";
      await createWalletUseCase.execute({
        playerId: new PlayerId(playerId),
        initialBalance: new Money(10000n),
      });

      // Perform operations
      await processDebitUseCase.execute(
        { playerId, amountCents: 3000n, betId: "bet-ledger-1" },
        "msg-ledger-1",
      );

      await processCreditUseCase.execute(
        { playerId, amountCents: 4500n, betId: "bet-ledger-1" },
        "msg-ledger-cashout-1",
      );

      // Verify via database
      const em = orm.em.fork();
      const transactions = await em.find(TransactionEntity, {
        wallet: { playerId },
      });

      expect(transactions.length).toBe(2);

      // Check first transaction (debit)
      const debitTxn = transactions.find((t) => t.type === "DEBIT");
      expect(debitTxn).toBeDefined();
      expect(debitTxn!.amountCents).toBe(3000n);
      expect(debitTxn!.balanceAfterCents).toBe(7000n);
      expect(debitTxn!.referenceId).toBe("bet-ledger-1");
      expect(debitTxn!.status).toBe("CONFIRMED");

      // Check second transaction (credit)
      const creditTxn = transactions.find((t) => t.type === "CREDIT");
      expect(creditTxn).toBeDefined();
      expect(creditTxn!.amountCents).toBe(4500n);
      expect(creditTxn!.balanceAfterCents).toBe(11500n);
      expect(creditTxn!.referenceId).toBe("bet-ledger-1");
      expect(creditTxn!.status).toBe("CONFIRMED");
    });
  });
});
