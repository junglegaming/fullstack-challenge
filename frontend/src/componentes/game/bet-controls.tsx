import { useEffect, useState } from 'react'
import { placeBet, cashout } from '../../services/game.service'
import { useGameStore } from '../../stores/game.store'
import { getWallet } from '../../services/wallet.service'
import { useWalletStore } from '../../stores/wallet.store'

export function BetControls() {
  const [amount, setAmount] = useState('100')
  const [loading, setLoading] = useState(false)

  // 💡 Lendo e alterando o estado global do Zustand
  const hasBet = useGameStore((state) => state.hasBet)
  const setHasBet = useGameStore((state) => state.setHasBet)

  const multiplier = useGameStore((state) => state.multiplier)
  const crashed = useGameStore((state) => state.crashed)

  // Calcula o retorno potencial de forma segura em centavos inteiros
  const amountInCents = Math.round(Number(amount) * 100)
  const possibleWinInCents = amountInCents * multiplier
  const possibleWin = possibleWinInCents / 100

  const setBalance = useWalletStore((state) => state.setBalance)

  async function handleBet() {
    try {
      setLoading(true)
      
      const amountToBet = Math.round(Number(amount) * 100)

      await placeBet(amountToBet)

      // Atualização otimista usando estritamente centavos inteiros
      useWalletStore.setState((state) => ({
        balance: state.balance - amountToBet
      })) 

      // Atualiza o estado global e o localStorage para persistência pós-F5
      setHasBet(true)
      localStorage.setItem('jungle_crash_has_bet', 'true')

    } catch (err) {
      console.error(err)
      alert('Erro ao apostar')
    } finally {
      setLoading(false)

      // Sincroniza o saldo real com a API após 1 segundo
      setTimeout(async () => {
        try {
          const wallet = await getWallet()
          setBalance(Number(wallet.balance))
        } catch (err) {
          console.error('Erro ao sincronizar carteira pós-aposta:', err)
        }
      }, 1000)
    }
  }

  async function handleCashout() {
    try {
      setLoading(true)

      const response = await cashout()

      setHasBet(false)
      localStorage.removeItem('jungle_crash_has_bet')

      const resultData = response?.data

      if (resultData) {
        const rawProfit = resultData.profit ?? resultData.value ?? resultData.paidMultiplier

        if (rawProfit !== undefined) {
          const profitInCents = Math.round(Number(rawProfit))

          useWalletStore.setState((state) => ({
            balance: state.balance + profitInCents // Soma inteiros de forma segura!
          }))
        }
      } else {
        console.warn('⚠️ [DEBUG] A propriedade "data" não foi encontrada na resposta da API.')
      }

    } catch (err) {
      console.error('❌ Erro no cashout:', err)
      alert('Erro no cashout')
    } finally {
      setLoading(false)

      setTimeout(async () => {
        try {
          const wallet = await getWallet()
          setBalance(Number(wallet.balance))
        } catch (err) {
          console.error('Erro ao sincronizar carteira pós-cashout:', err)
        }
      }, 1000)
    }
  }

  useEffect(() => {
    if (crashed) {
      setHasBet(false)
      localStorage.removeItem('jungle_crash_has_bet')
    }
  }, [crashed, setHasBet])
  
  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-2xl font-bold text-white">
        Fazer aposta
      </h2>

      <input
        type="number"
        min={1}
        max={1000}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={hasBet}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-white outline-none"
      />

      <div className="mt-4 rounded-xl bg-zinc-950 p-4 border border-zinc-800">
        <p className="text-sm text-zinc-500">
          Retorno potencial
        </p>

        <h3 className="text-3xl font-bold text-green-400">
          ${possibleWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>

      <div className="mt-6">
        {!hasBet ? (
          <button
            onClick={handleBet}
            disabled={loading || crashed}
            className="w-full rounded-xl bg-green-500 py-4 text-lg font-bold text-black transition hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? 'Apostando...' : 'Apostar'}
          </button>
        ) : (
          <button
            onClick={handleCashout}
            disabled={loading || crashed}
            className="w-full rounded-xl bg-yellow-500 py-4 text-lg font-bold text-black transition hover:scale-[1.02] disabled:opacity-50"
          >
            {loading
              ? 'Sacando...'
              : `Cashout (${multiplier.toFixed(2)}x)`}
          </button>
        )}
      </div>
    </div>
  )
}