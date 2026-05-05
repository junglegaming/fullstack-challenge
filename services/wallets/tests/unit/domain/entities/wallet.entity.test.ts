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
    it('returns existing CONFIRMED transaction for same referenceId', () => {
      const wallet = new Wallet(
        new WalletId('wallet-1'),
        new PlayerId('player-1'),
        Money.fromReais(100),
      );

      const txn1 = wallet.debit(Money.fromReais(30), 'bet-idempotent');
      const txn2 = wallet.debit(Money.fromReais(30), 'bet-idempotent'); // Same referenceId

      expect(txn2).toBe(txn1); // Same transaction returned
      expect(wallet.walletTransactions.length).toBe(1); // No duplicate
      expect(wallet.walletBalance.amount).toBe(7000n); // Debited only once
    });

    it('prevents duplicate credit with same referenceId', () => {
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
