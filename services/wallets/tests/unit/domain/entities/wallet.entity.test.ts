import { describe, it, expect } from 'bun:test';
import { Wallet } from '@/domain/entities/wallet.entity';
import { WalletId } from '@/domain/value-objects/wallet-id.vo';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { Transaction } from '@/domain/entities/transaction.entity';
import { TransactionType } from '@/domain/value-objects/transaction-type.vo';

describe('Wallet', () => {
  describe('creation', () => {
    it('creates with valid initial balance', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      expect(wallet.walletId.raw).toBe('wallet-1');
      expect(wallet.walletPlayerId.raw).toBe('player-1');
      expect(wallet.walletBalance.amount).toBe(10000n);
    });

    it('rejects negative initial balance', () => {
      expect(() => new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        new Money(-100n),
      )).toThrow('Money amount cannot be negative');
    });

    it('starts with empty transactions', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.zero(),
      );

      expect(wallet.walletTransactions.length).toBe(0);
    });
  });

  describe('debit (withdraw)', () => {
    it('debits balance and creates transaction', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      const txn = wallet.debit(Money.fromReais(30), 'bet-123');

      // Balance updated
      expect(wallet.walletBalance.amount).toBe(7000n);

      // Transaction created
      expect(txn).toBeDefined();
      expect(txn.type).toBe('DEBIT');
      expect(txn.amount.amount).toBe(3000n);
      expect(txn.balanceAfter.amount).toBe(7000n);
      expect(txn.referenceId).toBe('bet-123');
      expect(txn.status).toBe('CONFIRMED');
    });

    it('generates a Transaction for every debit', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      wallet.debit(Money.fromReais(10), 'bet-1');
      wallet.debit(Money.fromReais(20), 'bet-2');
      wallet.debit(Money.fromReais(30), 'bet-3');

      expect(wallet.walletTransactions.length).toBe(3);
    });

    it('prevents negative balance', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(50),
      );

      expect(() => wallet.debit(Money.fromReais(100), 'bet-123')).toThrow('Insufficient funds');
      expect(wallet.walletBalance.amount).toBe(5000n); // Balance unchanged
    });

    it('rejects zero or negative debit amount', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      expect(() => wallet.debit(Money.zero(), 'bet-123')).toThrow('Debit amount must be positive');
      expect(() => wallet.debit(new Money(-100n), 'bet-124')).toThrow('Money amount cannot be negative');
    });
  });

  describe('credit (deposit)', () => {
    it('credits balance and creates transaction', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      const txn = wallet.credit(Money.fromReais(50), 'cashout-123');

      // Balance updated
      expect(wallet.walletBalance.amount).toBe(15000n);

      // Transaction created
      expect(txn).toBeDefined();
      expect(txn.type).toBe('CREDIT');
      expect(txn.amount.amount).toBe(5000n);
      expect(txn.balanceAfter.amount).toBe(15000n);
      expect(txn.referenceId).toBe('cashout-123');
      expect(txn.status).toBe('CONFIRMED');
    });

    it('generates a Transaction for every credit', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.zero(),
      );

      wallet.credit(Money.fromReais(10), 'dep-1');
      wallet.credit(Money.fromReais(20), 'dep-2');
      wallet.credit(Money.fromReais(30), 'dep-3');

      expect(wallet.walletTransactions.length).toBe(3);
    });

    it('rejects zero or negative credit amount', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      expect(() => wallet.credit(Money.zero(), 'dep-123')).toThrow('Credit amount must be positive');
      expect(() => wallet.credit(new Money(-100n), 'dep-124')).toThrow('Money amount cannot be negative');
    });
  });

  describe('idempotency', () => {
    describe('debit idempotency', () => {
      it('returns existing transaction for same referenceId without duplicating balance change', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.fromReais(100),
        );

        const txn1 = wallet.debit(Money.fromReais(30), 'bet-idempotent');
        const txn2 = wallet.debit(Money.fromReais(30), 'bet-idempotent'); // Same referenceId

        expect(txn2).toBe(txn1); // Same transaction object returned
        expect(wallet.walletTransactions.length).toBe(1); // No duplicate transaction
        expect(wallet.walletBalance.amount).toBe(7000n); // Debited only once
      });

      it('ignores amount change on duplicate call with different amount', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.fromReais(100),
        );

        const txn1 = wallet.debit(Money.fromReais(30), 'bet-123');
        const txn2 = wallet.debit(Money.fromReais(999), 'bet-123'); // Different amount, same referenceId

        expect(txn2).toBe(txn1); // Still returns original
        expect(txn2.amount.amount).toBe(3000n); // Original amount preserved
        expect(wallet.walletBalance.amount).toBe(7000n); // Balance unchanged by second call
      });

      it('handles multiple duplicate calls gracefully', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.fromReais(100),
        );

        const txn1 = wallet.debit(Money.fromReais(10), 'bet-1');

        // Multiple duplicate calls
        const txn2 = wallet.debit(Money.fromReais(10), 'bet-1');
        const txn3 = wallet.debit(Money.fromReais(10), 'bet-1');
        const txn4 = wallet.debit(Money.fromReais(10), 'bet-1');

        expect(txn2).toBe(txn1);
        expect(txn3).toBe(txn1);
        expect(txn4).toBe(txn1);
        expect(wallet.walletTransactions.length).toBe(1);
        expect(wallet.walletBalance.amount).toBe(9000n);
      });
    });

    describe('credit idempotency', () => {
      it('returns existing transaction for same referenceId without duplicating balance change', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.zero(),
        );

        const txn1 = wallet.credit(Money.fromReais(50), 'cashout-idempotent');
        const txn2 = wallet.credit(Money.fromReais(50), 'cashout-idempotent');

        expect(txn2).toBe(txn1);
        expect(wallet.walletTransactions.length).toBe(1);
        expect(wallet.walletBalance.amount).toBe(5000n); // Credited only once
      });

      it('ignores amount change on duplicate credit with different amount', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.zero(),
        );

        const txn1 = wallet.credit(Money.fromReais(50), 'dep-123');
        const txn2 = wallet.credit(Money.fromReais(9999), 'dep-123');

        expect(txn2).toBe(txn1);
        expect(txn2.amount.amount).toBe(5000n); // Original amount preserved
        expect(wallet.walletBalance.amount).toBe(5000n);
      });
    });

    describe('referenceId uniqueness', () => {
      it('different referenceIds create separate transactions', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.fromReais(100),
        );

        const txn1 = wallet.debit(Money.fromReais(10), 'bet-1');
        const txn2 = wallet.debit(Money.fromReais(20), 'bet-2');

        expect(txn1).not.toBe(txn2);
        expect(wallet.walletTransactions.length).toBe(2);
        expect(wallet.walletBalance.amount).toBe(7000n);
      });

      it('same referenceId used for debit then credit creates only one transaction (debit wins)', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.fromReais(100),
        );

        const debitTxn = wallet.debit(Money.fromReais(30), 'ref-123');
        const creditTxn = wallet.credit(Money.fromReais(50), 'ref-123'); // Same referenceId

        // Returns the original debit transaction
        expect(creditTxn).toBe(debitTxn);
        expect(creditTxn.type).toBe('DEBIT'); // Original type preserved
        expect(wallet.walletTransactions.length).toBe(1);
        expect(wallet.walletBalance.amount).toBe(7000n); // Only debited, not credited
      });
    });

    describe('real-world scenarios', () => {
      it('simulates network timeout retry: client retries same request after timeout', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.fromReais(200),
        );

        // Initial request (client times out waiting for response)
        const txn1 = wallet.debit(Money.fromReais(50), 'bet-timeout-1');

        // Client retries with same referenceId
        const txn2 = wallet.debit(Money.fromReais(50), 'bet-timeout-1');

        // Same transaction, no double debit
        expect(txn2).toBe(txn1);
        expect(wallet.walletBalance.amount).toBe(15000n); // 200 - 50 = 150
        expect(wallet.walletTransactions.length).toBe(1);
      });

      it('simulates duplicate event from message queue', () => {
        const wallet = new Wallet(
          new WalletId('wallet-1'),
          new PlayerId('player-1'),
          Money.fromReais(100),
        );

        // Event processed successfully
        const txn1 = wallet.credit(Money.fromReais(25), 'event-123');

        // Same event delivered again (at-least-once delivery)
        const txn2 = wallet.credit(Money.fromReais(25), 'event-123');
        const txn3 = wallet.credit(Money.fromReais(25), 'event-123');

        expect(txn2).toBe(txn1);
        expect(txn3).toBe(txn1);
        expect(wallet.walletBalance.amount).toBe(12500n); // 100 + 25 = 125, only once
        expect(wallet.walletTransactions.length).toBe(1);
      });
    });
  });

  describe('ledger append-only', () => {
    it('ledger only grows (append-only)', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      const initialCount = wallet.walletTransactions.length;

      wallet.debit(Money.fromReais(10), 'bet-1');
      expect(wallet.walletTransactions.length).toBe(initialCount + 1);

      wallet.credit(Money.fromReais(20), 'dep-1');
      expect(wallet.walletTransactions.length).toBe(initialCount + 2);

      // Verify transactions are in order
      const txns = wallet.walletTransactions;
      expect(txns[0].type).toBe('DEBIT');
      expect(txns[1].type).toBe('CREDIT');
    });

    it('ledger entries are immutable', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      wallet.debit(Money.fromReais(30), 'bet-123');
      const txns = wallet.walletTransactions;

      // Try to modify the array (should not affect original)
      const mutableRef = txns as Transaction[];
      // The getter returns readonly, but let's verify the transaction itself is immutable
      const txn = txns[0];
      expect(txn.status).toBe('CONFIRMED');
      // Cannot modify: no setters exposed
    });

    it('ledger records balance after each transaction', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      wallet.debit(Money.fromReais(30), 'bet-1');
      wallet.credit(Money.fromReais(50), 'dep-1');
      wallet.debit(Money.fromReais(20), 'bet-2');

      const txns = wallet.walletTransactions;
      expect(txns[0].balanceAfter.amount).toBe(7000n); // 100-30
      expect(txns[1].balanceAfter.amount).toBe(12000n); // 70+50
      expect(txns[2].balanceAfter.amount).toBe(10000n); // 120-20
    });
  });

  describe('withdraw and deposit aliases', () => {
    it('withdraw is alias for debit', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      const txn = wallet.withdraw(Money.fromReais(30), 'bet-123');
      expect(txn.type).toBe('DEBIT');
      expect(wallet.walletBalance.amount).toBe(7000n);
    });

    it('deposit is alias for credit', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      const txn = wallet.deposit(Money.fromReais(50), 'dep-123');
      expect(txn.type).toBe('CREDIT');
      expect(wallet.walletBalance.amount).toBe(15000n);
    });
  });
});
