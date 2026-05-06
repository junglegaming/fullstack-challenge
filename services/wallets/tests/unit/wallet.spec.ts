import { Wallet } from '../../src/domain/wallet.entity'

describe('Wallet', () => {  
  it('should create wallet with initial balance', () => {
    const wallet = new Wallet('player-1', 1000n)

    expect(wallet.balance).toBe(1000n)
  })

  it('should credit balance correctly', () => {
    const wallet = new Wallet('player-1', 1000n)

    wallet.credit(500n)

    expect(wallet.balance).toBe(1500n)
  })

  it('should not allow credit with zero or negative amount', () => {
    const wallet = new Wallet('player-1', 1000n)

    expect(() => wallet.credit(0n)).toThrow()
    expect(() => wallet.credit(-100n)).toThrow()
  })

  it('should debit balance correctly', () => {
    const wallet = new Wallet('player-1', 1000n)

    wallet.debit(400n)

    expect(wallet.balance).toBe(600n)
  })

  it('should not allow debit with zero or negative amount', () => {
    const wallet = new Wallet('player-1', 1000n)

    expect(() => wallet.debit(0n)).toThrow()
    expect(() => wallet.debit(-100n)).toThrow()
  })

  it('should not allow debit if insufficient balance', () => {
    const wallet = new Wallet('player-1', 1000n)

    expect(() => wallet.debit(2000n)).toThrow()
  })
})