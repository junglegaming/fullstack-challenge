import { useState } from 'react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { api, ApiError } from '@/api/http'
import type { RoundPhase } from '@/types'

interface Props {
  phase: RoundPhase | null
  roundId: string | null
  playerId: string
  hasBetThisRound: boolean
  hasCashedOut: boolean
  onBetPlaced: () => void
  onCashedOut: () => void
}

export function BetPanel({ phase, hasBetThisRound, hasCashedOut, onBetPlaced, onCashedOut }: Props) {
  const [amountBRL, setAmountBRL] = useState('10')
  const [loading, setLoading] = useState(false)

  const canBet = phase === 'BETTING' && !hasBetThisRound
  const canCashout = phase === 'RUNNING' && hasBetThisRound && !hasCashedOut

  async function handleBet() {
    const cents = parseFloat(amountBRL.replace(',', '.')) * 100
    const amount = Math.trunc(cents)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor inválido')
      return
    }
    if (amount < 100) {
      toast.error('Valor mínimo: R$ 1,00')
      return
    }
    setLoading(true)
    try {
      await api.post('/games/bet', { amountCents: amount })
      onBetPlaced()
      toast.success('Aposta registrada!')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao apostar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleCashout() {
    setLoading(true)
    try {
      await api.post('/games/bet/cashout')
      onCashedOut()
      toast.success('Cash out realizado!')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao sacar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-zinc-800 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Apostar</h2>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">R$</span>
          <input
            type="number"
            min="1"
            step="1"
            value={amountBRL}
            onChange={e => setAmountBRL(e.target.value)}
            disabled={!canBet || loading}
            className={clsx(
              'w-full rounded-lg border bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white outline-none',
              'border-zinc-700 focus:border-emerald-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
        </div>

        {!hasBetThisRound ? (
          <button
            onClick={handleBet}
            disabled={!canBet || loading}
            className={clsx(
              'rounded-lg px-5 py-2 text-sm font-bold transition-colors',
              canBet && !loading
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'cursor-not-allowed bg-zinc-700 text-zinc-500',
            )}
          >
            {loading ? '...' : 'Apostar'}
          </button>
        ) : (
          <button
            onClick={handleCashout}
            disabled={!canCashout || loading}
            className={clsx(
              'rounded-lg px-5 py-2 text-sm font-bold transition-colors',
              canCashout && !loading
                ? 'animate-pulse bg-amber-500 text-black hover:bg-amber-400'
                : 'cursor-not-allowed bg-zinc-700 text-zinc-500',
            )}
          >
            {loading ? '...' : hasCashedOut ? 'Sacado ✓' : 'Cash Out'}
          </button>
        )}
      </div>

      {phase === 'BETTING' && !hasBetThisRound && (
        <div className="flex gap-2">
          {[5, 10, 25, 50].map(v => (
            <button
              key={v}
              onClick={() => setAmountBRL(String(v))}
              className="flex-1 rounded-md bg-zinc-700 py-1 text-xs font-semibold text-zinc-300 hover:bg-zinc-600"
            >
              R${v}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
