import { useState } from 'react'
import { placeBet, cashout } from '../../services/game.service'

export function BetControls() {
  const [amount, setAmount] = useState('100')

  async function handleBet() {
    try {
      await placeBet(Number(amount))

      alert('Aposta realizada!')
    } catch (err) {
      alert('Erro ao apostar')
    }
  }

  async function handleCashout() {
    try {
      await cashout()

      alert('Cashout realizado!')
    } catch (err) {
      alert('Erro no cashout')
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded bg-zinc-950 p-3"
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleBet}
          className="flex-1 rounded bg-green-500 py-3 font-bold text-black"
        >
          Apostar
        </button>

        <button
          onClick={handleCashout}
          className="flex-1 rounded bg-yellow-500 py-3 font-bold text-black"
        >
          Cashout
        </button>
      </div>
    </div>
  )
}